import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { updateProfile, updateMicStatus, saveOnboarding } from '../api/user.js';
import { assessPronunciation } from '../api/progress.js';
import { Mic, Volume2 } from 'lucide-react';

// Import tutor assets
import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articucate_female.jpeg';

const TEST_WORDS = [
  { word: 'Apple', definition: 'আপেল (একটি ফল)' },
  { word: 'Computer', definition: 'কম্পিউটার (একটি ইলেকট্রনিক যন্ত্র)' },
  { word: 'English', definition: 'ইংরেজি (একটি ভাষা)' }
];

export default function Onboarding() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: Select Guide, 2: Mic Check, 3: Speech Test, 4: Done
  const [guide, setGuide] = useState('MALE'); // 'MALE' or 'FEMALE'
  
  // Mic check states
  const [micStream, setMicStream] = useState(null);
  const [micError, setMicError] = useState('');
  const [volume, setVolume] = useState(0);
  const [micJitter, setMicJitter] = useState(false);
  const [micChecked, setMicChecked] = useState(false);
  const [calibrating, setCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  
  // Audio recording and speech assessment states
  const [wordIndex, setWordIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [scores, setScores] = useState([]); // List of booleans (correct/incorrect)
  const [testResult, setTestResult] = useState(null); // { level, correctCount }
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  
  // Pronunciation feedback states
  const [pronScore, setPronScore] = useState(null);
  const [pronFeedback, setPronFeedback] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [isTestRecording, setIsTestRecording] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Clean up audio context & recorder on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
      if (micStream) micStream.getTracks().forEach(track => track.stop());
    };
  }, [micStream]);

  // Revoke the last recorded-audio object URL on unmount (each new recording already revokes the prior one)
  useEffect(() => {
    return () => {
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, [recordedAudioUrl]);

  // Handle Guide preference submission
  async function handleSelectGuide() {
    try {
      setIsLoading(true);
      await updateProfile(user.id, { guide_preference: guide });
      await refreshUser();
      setStep(2);
    } catch (err) {
      setApiError('গাইড নির্বাচন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  }

  // Request Mic and run jitter/noise calibration
  async function startMicCheck() {
    setMicError('');
    try {
      // Disabling these explicitly because Chrome's software noise-suppression/AGC, stacked on
      // top of an array mic's own onboard DSP (e.g. Intel Smart Sound Technology), is a known
      // cause of "track is live and unmuted, but the captured signal is suppressed to near-zero"
      // on certain laptops — the OS/driver sees real audio, the browser hands WebAudio silence.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      setMicStream(stream);

      const audioTrack = stream.getAudioTracks()[0];
      console.log('[micCheck] got stream', {
        trackLabel: audioTrack?.label,
        enabled: audioTrack?.enabled,
        muted: audioTrack?.muted,
        readyState: audioTrack?.readyState,
        settings: audioTrack?.getSettings?.()
      });

      // Audio Analysis setup
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      console.log('[micCheck] AudioContext created', { state: audioCtx.state, sampleRate: audioCtx.sampleRate });

      // Browsers often create/keep AudioContext in 'suspended' state until explicitly resumed —
      // if that happens, the analyser never processes audio and volume reads as 0 forever.
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
        console.log('[micCheck] AudioContext was suspended, resumed -> state =', audioCtx.state);
      }

      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      // Lower the noise floor the byte-data mapping uses (default is -100dB) so quieter mics/rooms
      // still produce visible non-zero values instead of clipping to 0.
      analyser.minDecibels = -100;
      analyser.maxDecibels = -10;
      console.log('[micCheck] analyser config', { minDecibels: analyser.minDecibels, maxDecibels: analyser.maxDecibels, fftSize: analyser.fftSize });

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      // Real-time volume visualizer
      let frameCount = 0;
      let peakEverSeen = 0;
      const drawVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const frameMax = Math.max(...dataArray);
        if (frameMax > peakEverSeen) peakEverSeen = frameMax;
        setVolume(Math.min(100, Math.round(average * 1.5)));

        // Throttled log so the console stays readable — once every ~60 frames (~1s)
        frameCount++;
        if (frameCount % 60 === 0) {
          console.log('[micCheck] volume sample', {
            average: average.toFixed(2),
            frameMax,
            peakEverSeen,
            rawSnippet: Array.from(dataArray.slice(0, 10)),
            contextState: audioCtx.state
          });
        }

        animationFrameRef.current = requestAnimationFrame(drawVolume);
      };
      drawVolume();
      
      // Run noise/jitter check (stay silent for 2 seconds)
      setCalibrating(true);
      setCalibrationProgress(0);
      
      let samples = [];
      const interval = setInterval(() => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        samples.push(sum / bufferLength);
        
        setCalibrationProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      setTimeout(async () => {
        // Calculate standard deviation of volume to detect jitter
        const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
        const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;
        const stdDev = Math.sqrt(variance);
        
        const isJittery = stdDev > 2.0 || mean > 15; // Jitter if standard dev or mean volume is high in silence
        setMicJitter(isJittery);
        setCalibrating(false);
        setMicChecked(true);
        
        // Save to backend
        const micQualityScore = Math.max(0, Math.min(100, Math.round(100 - stdDev * 10)));
        console.log('[micCheck] calibration result', { samples, mean, stdDev, isJittery, micQualityScore });

        try {
          const res = await updateMicStatus(user.id, {
            mic_verified: true,
            mic_quality_score: micQualityScore
          });
          console.log('[micCheck] updateMicStatus response', res);
        } catch (statusErr) {
          console.error('[micCheck] updateMicStatus failed', statusErr);
        }
        await refreshUser();
      }, 2000);
      
    } catch (err) {
      console.error('[micCheck] getUserMedia/setup failed', err);
      setMicError('মাইক্রোফোন সংযোগ ব্যর্থ হয়েছে। ব্রাউজার পারমিশন চেক করুন।');
    }
  }

  // Quick 3-second record-and-playback, independent of the AI assessment pipeline --
  // lets you verify with your own ears whether the browser is actually capturing your voice
  // at all, before trusting any volume meter or Azure score.
  function recordMicTestClip() {
    if (!micStream || isTestRecording) return;
    console.log('[micCheck] starting 3s raw test recording');

    const chunks = [];
    const recorder = new MediaRecorder(micStream, { mimeType: 'audio/webm' });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      console.log('[micCheck] test recording captured', { sizeBytes: blob.size, chunkCount: chunks.length });
      setRecordedAudioUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    };

    recorder.start();
    setIsTestRecording(true);
    setTimeout(() => {
      recorder.stop();
      setIsTestRecording(false);
    }, 3000);
  }

  // Audio recording handlers for Speech Test
  async function startRecording() {
    setRecognizedText('');
    setPronScore(null);
    setPronFeedback('');
    audioChunksRef.current = [];

    try {
      const stream = micStream || await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      if (!micStream) setMicStream(stream);

      // WebM audio format recording
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      console.log('[speechTest] MediaRecorder started', { mimeType: mediaRecorder.mimeType, state: mediaRecorder.state });

      mediaRecorder.ondataavailable = (event) => {
        console.log('[speechTest] chunk received', { sizeBytes: event.data.size });
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('[speechTest] recording stopped', { totalSizeBytes: audioBlob.size, chunkCount: audioChunksRef.current.length });

        setRecordedAudioUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(audioBlob);
        });

        await evaluateSpeech(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Failed to start audio recording:', err);
      alert('রেকর্ডিং চালু করা যায়নি। অনুগ্রহ করে মাইক পারমিশন চেক করুন।');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  function playRecordedAudio() {
    if (!recordedAudioUrl) return;
    const audio = new Audio(recordedAudioUrl);
    setIsPlayingRecording(true);
    audio.onended = () => setIsPlayingRecording(false);
    audio.onerror = () => setIsPlayingRecording(false);
    audio.play();
  }

  async function evaluateSpeech(audioBlob) {
    setIsEvaluating(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'attempt.webm');
      formData.append('referenceText', TEST_WORDS[wordIndex].word);

      console.log('[speechTest] sending to /assess/pronunciation/assess', {
        referenceText: TEST_WORDS[wordIndex].word,
        blobSizeBytes: audioBlob.size,
        blobType: audioBlob.type
      });

      // Call pronunciation assessment API
      const data = await assessPronunciation(formData);
      console.log('[speechTest] assessPronunciation response', data);

      setRecognizedText(data.recognized_text || '');
      setPronScore(data.overall_score);
      setPronFeedback(data.feedback);

      // The backend denoises the recording before scoring it — swap playback to that cleaned
      // version once it comes back, so "your recording" matches what was actually scored.
      if (data.denoised_audio_url) {
        setRecordedAudioUrl(prev => {
          if (prev) URL.revokeObjectURL(prev);
          return data.denoised_audio_url;
        });
      }

      const isCorrect = data.overall_score >= 60; // 60% accuracy threshold to pass
      setScores(prev => [...prev, isCorrect]);
    } catch (err) {
      console.error('[speechTest] Speech evaluation failed:', err);
      setRecognizedText('(উচ্চারণ বোঝা যায়নি)');
      setPronScore(0);
      setPronFeedback('দুঃখিত, সংযোগে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      setScores(prev => [...prev, false]);
    } finally {
      setIsEvaluating(false);
    }
  }

  // Advance speech test after showing scoring feedback
  useEffect(() => {
    if (scores.length > wordIndex) {
      const timer = setTimeout(() => {
        if (wordIndex < TEST_WORDS.length - 1) {
          setWordIndex(prev => prev + 1);
          setRecognizedText('');
          setPronScore(null);
          setPronFeedback('');
        } else {
          // Test completed - calculate level
          const correctCount = scores.filter(x => x).length;
          let finalLevel = 'A1';
          if (correctCount === 3) finalLevel = 'B1';
          else if (correctCount >= 1) finalLevel = 'A2';
          
          setTestResult({ level: finalLevel, correctCount });
          setStep(4);
          
          // Submit onboarding assessment
          submitOnboardingAssessment(finalLevel, correctCount);
        }
      }, 3000); // Wait 3 seconds to let user read the AI feedback score

      return () => clearTimeout(timer);
    }
  }, [scores]);

  async function submitOnboardingAssessment(level, correctCount) {
    try {
      setIsLoading(true);
      await saveOnboarding({
        assessed_level: level,
        vocab_score: Math.round((correctCount / 3) * 100),
        pronunciation_score: Math.round((correctCount / 3) * 100),
        ai_notes: `Completed onboarding test with ${correctCount}/3 correct pronunciations. Placed at ${level}.`
      });
      await refreshUser();
    } catch (err) {
      setApiError('অ্যাসেসমেন্ট ফলাফল সংরক্ষণ করা যায়নি।');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="colorful-mesh-container">
      <div className="mesh-blob-3"></div>

      <div className="glass-form-card animate-fade-in" style={{ maxWidth: '550px' }}>
        <div className="form-watermark">
          <span className="form-watermark-icon">🎙️</span>
          <span className="form-watermark-text">ARTICULATE AI</span>
        </div>

        {/* Onboarding Stage Stepper */}
        <div className="flex justify-between items-center mb-6 p-2 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md overflow-x-auto gap-2 scrollbar-none">
          {[
            { step: 1, label: 'টিউটর গাইড' },
            { step: 2, label: 'মাইক পরীক্ষা' },
            { step: 3, label: 'প্লেসমেন্ট টেস্ট' },
            { step: 4, label: 'ফলাফল সম্পন্ন' }
          ].map((s) => (
            <div
              key={s.step}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                step === s.step
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                  : step > s.step
                  ? 'text-indigo-400 bg-indigo-950/10'
                  : 'text-slate-500'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                step === s.step
                  ? 'bg-white text-indigo-600'
                  : step > s.step
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-white/5 text-slate-500'
              }`}>
                {s.step}
              </span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* STEP 1: SELECT TUTOR GUIDE */}
        {step === 1 && (
          <div>
            <h1 className="glass-title">Choose Your Tutor</h1>
            <p className="glass-subtitle">
              আপনার লার্নিং জার্নিতে আপনাকে সাহায্য করার জন্য একজন গাইড নির্বাচন করুন।
            </p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {/* Male Tutor: Rohit */}
              <div
                onClick={() => setGuide('MALE')}
                className={`cursor-pointer rounded-2xl p-4 border text-center transition duration-300 ${
                  guide === 'MALE'
                    ? 'border-indigo-500 bg-indigo-500/10 scale-102 shadow-lg'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 border-2 border-indigo-500/30">
                  <img src={maleAvatar} alt="Rohit" className="w-full h-full object-cover" />
                </div>
                <div className="font-bold text-white text-lg">Rohit (রোহিত)</div>
                <div className="text-xs text-indigo-300 mt-1 font-semibold">Male Tutor Guide</div>
              </div>

              {/* Female Tutor: Riya */}
              <div
                onClick={() => setGuide('FEMALE')}
                className={`cursor-pointer rounded-2xl p-4 border text-center transition duration-300 ${
                  guide === 'FEMALE'
                    ? 'border-indigo-500 bg-indigo-500/10 scale-102 shadow-lg'
                    : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 border-2 border-indigo-500/30">
                  <img src={femaleAvatar} alt="Riya" className="w-full h-full object-cover" />
                </div>
                <div className="font-bold text-white text-lg">Riya (রিয়া)</div>
                <div className="text-xs text-indigo-300 mt-1 font-semibold">Female Tutor Guide</div>
              </div>
            </div>

            <button onClick={handleSelectGuide} className="glass-button" disabled={isLoading}>
              Next: Mic Quality Check
            </button>
            {apiError && <div className="glass-alert glass-alert-error">{apiError}</div>}
          </div>
        )}

        {/* STEP 2: MIC CHECK */}
        {step === 2 && (
          <div>
            <h1 className="glass-title">Microphone Test</h1>
            <p className="glass-subtitle">
              সঠিকভাবে স্পিচ টেস্ট এবং কথা বলার অনুশীলনের জন্য আপনার মাইক চেক করতে হবে।
            </p>

            <div className="bg-white/5 rounded-xl p-5 border border-white/10 mb-6 text-center">
              {!micStream ? (
                <div>
                  <div className="text-slate-300 text-sm mb-4">
                    মাইক টেস্ট শুরু করতে অনুমতি দিন। শান্ত ঘরে থাকা বাঞ্ছনীয়।
                  </div>
                  <button onClick={startMicCheck} className="glass-button" style={{ display: 'inline-flex', width: 'auto' }}>
                    🎙️ Grant Mic Access
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {calibrating && (
                    <div>
                      <div className="text-yellow-400 font-bold mb-2">নীরব থাকুন... (Calibration)</div>
                      <div className="text-xs text-slate-400">আমরা ঘরের ব্যাকগ্রাউন্ড নয়েজ পরিমাপ করছি...</div>
                      <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mt-3">
                        <div
                          className="bg-indigo-500 h-full transition-all duration-200"
                          style={{ width: `${calibrationProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {micChecked && (
                    <div>
                      <div className="text-green-400 font-bold mb-1">✅ মাইক চেক সম্পন্ন!</div>
                      <div className="text-slate-300 text-xs mb-3">মাইক ভলিউম লেভেল ট্র্যাকিং করা যাচ্ছে।</div>
                      
                      {/* Live Volume Meter */}
                      <div className="flex items-center gap-3 justify-center">
                        <span className="text-xs text-slate-400">ভলিউম:</span>
                        <div className="flex-1 max-w-[200px] bg-white/10 h-3 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-400 h-full transition-all duration-100"
                            style={{ width: `${volume}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-cyan-400 font-bold">{volume}%</span>
                      </div>

                      {/* Quick mic test: record 3s raw audio and play it back, no AI involved */}
                      <div className="mt-4 flex flex-col items-center gap-2">
                        <button
                          onClick={recordMicTestClip}
                          disabled={isTestRecording}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            isTestRecording
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                          }`}
                        >
                          <Mic size={13} />
                          {isTestRecording ? 'রেকর্ড হচ্ছে... (৩ সেকেন্ড)' : '৩ সেকেন্ড রেকর্ড করে শুনুন'}
                        </button>
                        {recordedAudioUrl && (
                          <button
                            onClick={playRecordedAudio}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                              isPlayingRecording
                                ? 'bg-red-500 text-white animate-pulse'
                                : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                            }`}
                          >
                            <Volume2 size={13} />
                            {isPlayingRecording ? 'বাজছে...' : 'আপনার রেকর্ডিং শুনুন'}
                          </button>
                        )}
                      </div>

                      {micJitter && (
                        <div className="glass-alert glass-alert-error mt-4 text-left">
                          ⚠️ <strong>সতর্কতা:</strong> আপনার মাইকে প্রচুর জিটার/নয়েজ শনাক্ত হয়েছে। শান্ত পরিবেশে না গেলে আপনার উচ্চারণ ভুল হিসেবে মূল্যায়িত হতে পারে।
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {micError && <div className="glass-alert glass-alert-error mb-4">{micError}</div>}

            <button
              onClick={() => setStep(3)}
              className="glass-button"
              disabled={!micChecked}
              style={{ opacity: micChecked ? 1 : 0.5 }}
            >
              Start Placement Speech Test
            </button>
          </div>
        )}

        {/* STEP 3: SPEECH PLACEMENT TEST */}
        {step === 3 && (
          <div>
            <h1 className="glass-title">Placement Test</h1>
            <p className="glass-subtitle">
              নিচের ইংরেজি শব্দটি জোরে এবং সঠিকভাবে উচ্চারণ করুন।
            </p>

            <div className="text-center bg-white/5 rounded-2xl p-6 border border-white/10 mb-6">
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">
                Word {wordIndex + 1} of {TEST_WORDS.length}
              </div>
              <div className="text-4xl font-extrabold text-white my-3 tracking-wide">
                "{TEST_WORDS[wordIndex].word}"
              </div>
              <div className="text-sm text-cyan-400 font-medium mb-6">
                {TEST_WORDS[wordIndex].definition}
              </div>

              <div className="mt-6 flex flex-col items-center justify-center">
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 border-none outline-none cursor-pointer ${
                    recording
                      ? 'bg-red-500 scale-110 shadow-red shadow-lg animate-pulse'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
                  }`}
                  style={{ fontSize: '2rem' }}
                >
                  {recording ? '🛑' : '🎙️'}
                </button>
                <div className="text-xs text-slate-400 mt-3 font-medium">
                  {recording ? 'বলুন (ছেড়ে দিলে মূল্যায়িত হবে)' : 'রেকর্ড করতে চেপে ধরে রাখুন'}
                </div>
              </div>

              {isEvaluating && (
                <div className="mt-6 text-sm text-indigo-300 flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  <span>AI আপনার উচ্চারণ মূল্যায়ন করছে...</span>
                </div>
              )}

              {pronScore !== null && (
                <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 animate-bounce-in">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-300 font-medium">উচ্চারণ স্কোর:</span>
                    <span className={`text-xl font-black ${pronScore >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                      {pronScore}%
                    </span>
                  </div>
                  <div className="text-sm text-slate-200 mt-1 font-medium">{pronFeedback}</div>
                  {recognizedText && (
                    <div className="text-xs text-slate-400 mt-2">
                      আমরা শুনেছি: <span className="italic font-semibold text-slate-300">"{recognizedText}"</span>
                    </div>
                  )}
                  {recordedAudioUrl && (
                    <button
                      onClick={playRecordedAudio}
                      className={`mt-3 w-full h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                        isPlayingRecording
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                      }`}
                    >
                      <Mic size={13} />
                      {isPlayingRecording ? 'বাজছে...' : 'আপনার রেকর্ডিং শুনুন'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-center">
              {TEST_WORDS.map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    i === wordIndex
                      ? 'bg-indigo-500 scale-125'
                      : i < scores.length
                      ? scores[i]
                        ? 'bg-green-500'
                        : 'bg-red-500'
                      : 'bg-white/10'
                  }`}
                ></div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: ASSESSMENT LEVEL ASSIGNED */}
        {step === 4 && (
          <div className="text-center">
            <h1 className="glass-title">Assessment Completed!</h1>
            <p className="glass-subtitle">
              আপনার ইংরেজি স্তরের মূল্যায়ন সম্পন্ন হয়েছে।
            </p>

            {testResult && (
              <div className="my-8 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 animate-bounce-in">
                <div className="text-slate-400 text-xs uppercase tracking-widest font-bold">Your Placement Level</div>
                <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 my-2">
                  {testResult.level}
                </div>
                <div className="text-sm text-slate-300 mt-2">
                  আপনি ৩টি শব্দের মধ্যে <strong>{testResult.correctCount}টি</strong> শব্দ সন্তোষজনকভাবে উচ্চারণ করতে পেরেছেন।
                </div>
              </div>
            )}

            <div className="text-left bg-white/5 rounded-xl p-4 border border-white/10 mb-6 text-sm text-slate-300 space-y-2">
              <div className="font-bold text-white flex items-center gap-2">
                <span>{guide === 'FEMALE' ? '👩‍🏫' : '👨‍🏫'}</span>
                <span>টিউটর গাইড বার্তা:</span>
              </div>
              <div className="leading-relaxed">
                {testResult?.level === 'B1' && 'চমৎকার! আপনার ইংরেজি উচ্চারণ বেশ সুন্দর। আমরা আপনাকে সরাসরি চ্যাপ্টার ৩ (ইন্টারমিডিয়েট লেভেল) থেকে শুরু করছি।'}
                {testResult?.level === 'A2' && 'বেশ ভালো! আপনার উচ্চারণ চমৎকার। আমরা প্রি-ইন্টারমিডিয়েট লেভেল (চ্যাপ্টার ২) থেকে শুরু করছি।'}
                {testResult?.level === 'A1' && 'চিন্তা করবেন না! আমরা একদম গোঁড়া থেকে বেসিক ইংরেজি শব্দগুলো দিয়ে শুরু করব। চ্যাপ্টার ১ দিয়ে পথচলা শুরু হোক।'}
              </div>
            </div>

            <button onClick={() => navigate('/curriculum')} className="glass-button" disabled={isLoading}>
              Start Learning Journey
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

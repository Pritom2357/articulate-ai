import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getLesson } from '../api/curriculum.js';
import { markLessonComplete, assessPronunciation } from '../api/progress.js';
import useAuth from '../hooks/useAuth.js';

// Import tutor assets
import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articucate_female.jpeg';

export default function LessonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();

  const [lesson, setLesson] = useState(null);
  const [words, setWords] = useState([]);
  const [phrases, setPhrases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Wizard steps: 1: Learn, 2: Practice (Flashcards), 3: Speak Words, 4: Speak Sentences, 5: Completed
  const [wizardStep, setWizardStep] = useState(1);

  // Active guide selection
  const activeTutor = user?.guide_preference || 'MALE';
  const tutorAvatar = activeTutor === 'FEMALE' ? femaleAvatar : maleAvatar;
  const tutorName = activeTutor === 'FEMALE' ? 'Riya (রিয়া)' : 'Rohit (রোহিত)';

  // TTS speaking states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingWordId, setSpeakingWordId] = useState(null);

  // Step 2: Mini Flashcard practice states
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Step 3 & 4: Recording and Pronunciation Assessment States
  const [testWordIndex, setTestWordIndex] = useState(0);
  const [testPhraseIndex, setTestPhraseIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [pronScore, setPronScore] = useState(null);
  const [pronFeedback, setPronFeedback] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const [passCount, setPassCount] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    async function loadLesson() {
      try {
        setLoading(true);
        const result = await getLesson(id);
        setLesson(result.lesson);
        setWords(result.words || []);
        setPhrases(result.phrases || []);
      } catch (err) {
        setError(err.payload?.error || err.message || 'Unable to load lesson');
      } finally {
        setLoading(false);
      }
    }
    loadLesson();
  }, [id]);

  // TTS pronunciation player
  const playTTS = (text, wordId = null) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85; // slightly slower for learners

      utterance.onstart = () => {
        setIsSpeaking(true);
        if (wordId) setSpeakingWordId(wordId);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setSpeakingWordId(null);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      alert('আপনার ব্রাউজার টেক্সট-টু-স্পিচ সাপোর্ট করে না।');
    }
  };

  // Recording methods
  const startRecording = async () => {
    setRecognizedText('');
    setPronScore(null);
    setPronFeedback('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await uploadSpeechAttempt(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Mic error:', err);
      alert('মাইক্রোফোন চালু করা যায়নি। অনুগ্রহ করে পারমিশন চেক করুন।');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const uploadSpeechAttempt = async (audioBlob) => {
    setIsEvaluating(true);
    try {
      const isWordTest = wizardStep === 3;
      const refText = isWordTest ? words[testWordIndex].word : phrases[testPhraseIndex].phrase_en;
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'attempt.webm');
      formData.append('referenceText', refText);
      
      if (isWordTest) {
        formData.append('wordId', words[testWordIndex].id);
        formData.append('attemptType', 'WORD');
      } else {
        formData.append('phraseId', phrases[testPhraseIndex].id);
        formData.append('attemptType', 'PHRASE');
      }

      // We can mock testId and questionId for general lessons or just omit them
      formData.append('testId', '1');
      formData.append('questionId', (isWordTest ? testWordIndex : testPhraseIndex) + 1);

      const response = await assessPronunciation(formData);

      setRecognizedText(response.recognized_text || '');
      setPronScore(response.overall_score);
      setPronFeedback(response.feedback);

      if (response.overall_score >= 60) {
        setPassCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Speech assessment error:', err);
      setPronScore(0);
      setPronFeedback('মূল্যায়ন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsEvaluating(false);
    }
  };

  const nextWordTest = () => {
    setPronScore(null);
    setPronFeedback('');
    setRecognizedText('');
    if (testWordIndex < words.length - 1) {
      setTestWordIndex(prev => prev + 1);
    } else {
      // Move to sentence test if phrases exist, otherwise completion
      if (phrases.length > 0) {
        setWizardStep(4);
      } else {
        completeLesson();
      }
    }
  };

  const nextPhraseTest = () => {
    setPronScore(null);
    setPronFeedback('');
    setRecognizedText('');
    if (testPhraseIndex < phrases.length - 1) {
      setTestPhraseIndex(prev => prev + 1);
    } else {
      completeLesson();
    }
  };

  const completeLesson = async () => {
    try {
      setLoading(true);
      await markLessonComplete({ lessonId: id, score: 100 });
      await refreshUser();
      setWizardStep(5);
    } catch (err) {
      setError('প্রোগ্রেস সংরক্ষণ ব্যর্থ হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !lesson) {
    return <div className="page-container text-center py-20 text-slate-500">Loading lesson content...</div>;
  }

  return (
    <div className="page-container">
      {/* Lesson Header */}
      <div className="page-header border-b border-slate-200 pb-4 mb-6">
        <div>
          <h1 className="page-title text-indigo-900">{lesson?.title || `Lesson ${id}`}</h1>
          <p className="page-subtitle text-slate-500">{lesson?.title_bn}</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-slate-100 rounded-full px-3 py-1 font-bold text-slate-600">
          <span>🎯 Lesson Type:</span>
          <span className="text-indigo-600 uppercase">{lesson?.type}</span>
        </div>
      </div>

      {error && <div className="glass-alert glass-alert-error mb-4">{error}</div>}

      {/* Tutor Speech Bubble Area */}
      <div className="flex gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 mb-6 shadow-sm">
        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500/30 flex-shrink-0 transition-all duration-300 ${isSpeaking ? 'scale-108 animate-pulse shadow-md' : ''}`}>
          <img src={tutorAvatar} alt="Tutor" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-indigo-900 text-sm">{tutorName} (গাইড)</div>
          <div className="text-sm text-slate-700 leading-relaxed mt-1 font-medium italic">
            {wizardStep === 1 && `"স্বাগতম! আজকে আমরা নতুন শব্দ শিখব। প্রতিটি শব্দ শুনুন এবং তা বাংলা অর্থের সাথে মুখস্থ করুন।"`}
            {wizardStep === 2 && `"এবার ফ্ল্যাশ-কার্ড দিয়ে প্র্যাকটিস করার পালা। কার্ডগুলো উল্টে তার বাংলা অর্থ মেলাবার চেষ্টা করুন।"`}
            {wizardStep === 3 && `"উৎকারণ টেস্ট শুরু করা যাক! মাইক চেপে ধরে শব্দটি বলুন। কমপক্ষে ৬০% নির্ভুল হতে হবে।"`}
            {wizardStep === 4 && `"খুব ভালো করেছেন! এবার আমরা শব্দগুলো নিয়ে সম্পূর্ণ বাক্য বলব। মাইক চেপে পুরো বাক্যটি বলুন।"`}
            {wizardStep === 5 && `"অভিনন্দন! আপনার আজকের লেসনটি সম্পূর্ণ সফল হয়েছে। আপনার প্রোগ্রেস সেভ করা হয়েছে এবং আপনি ৫০ XP পেয়েছেন।"`}
          </div>
        </div>
      </div>

      {/* STEP 1: LEARN MODE */}
      {wizardStep === 1 && (
        <div className="space-y-6">
          <div className="card-card p-6">
            <h2 className="card-title text-slate-800 mb-4 flex items-center gap-2">
              <span>📚</span> Vocabulary List (শব্দভান্ডার)
            </h2>
            <div className="space-y-3">
              {words.map((word) => (
                <div key={word.id} className="word-item flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition">
                  <div>
                    <div className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                      {word.word}
                      {word.ipa && <span className="font-mono text-xs text-slate-400">[{word.ipa}]</span>}
                    </div>
                    <div className="text-sm text-slate-500 mt-1 font-semibold">অর্থ: {word.bangla_meaning}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => playTTS(word.word, word.id)}
                      className={`w-10 h-10 rounded-full border-none flex items-center justify-center cursor-pointer transition ${
                        speakingWordId === word.id
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
                      }`}
                      style={{ fontSize: '1.2rem' }}
                    >
                      🔊
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setWizardStep(2)} className="glass-button">
            Next: Practice Flashcards (ফ্ল্যাশ-কার্ড প্র্যাকটিস)
          </button>
        </div>
      )}

      {/* STEP 2: PRACTICE (FLASHCARDS) */}
      {wizardStep === 2 && (
        <div className="space-y-6 text-center">
          <div className="card-card p-6 bg-slate-50/50">
            <div className="text-xs text-slate-400 font-bold mb-4 uppercase">
              Word {practiceIndex + 1} of {words.length}
            </div>

            <div className="card-scene mx-auto" onClick={() => setIsCardFlipped(!isCardFlipped)}>
              <div className={`flip-card ${isCardFlipped ? 'is-flipped' : ''}`}>
                <div className="card-face card-face-front">
                  <div className="text-3xl font-extrabold text-white">{words[practiceIndex]?.word}</div>
                  <div className="text-xs text-cyan-300 mt-4 font-semibold">ক্লিক করুন (অর্থ দেখতে) 🔄</div>
                </div>
                <div className="card-face card-face-back">
                  <div className="text-2xl font-bold text-white">{words[practiceIndex]?.bangla_meaning}</div>
                  <div className="text-xs text-indigo-200 mt-4 font-semibold font-mono">[{words[practiceIndex]?.ipa}]</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={() => {
                  setIsCardFlipped(false);
                  setPracticeIndex(prev => Math.max(0, prev - 1));
                }}
                disabled={practiceIndex === 0}
                className="secondary-button"
                style={{ opacity: practiceIndex === 0 ? 0.5 : 1 }}
              >
                ◀ Previous
              </button>
              <button
                onClick={() => {
                  setIsCardFlipped(false);
                  if (practiceIndex < words.length - 1) {
                    setPracticeIndex(prev => prev + 1);
                  } else {
                    setWizardStep(3);
                  }
                }}
                className="form-button"
              >
                {practiceIndex < words.length - 1 ? 'Next Word ▶' : 'Next: Speak Test (উচ্চারণ পরীক্ষা) ▶'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: WORD SPEAKING TEST */}
      {wizardStep === 3 && (
        <div className="space-y-6">
          <div className="card-card p-6 text-center bg-slate-50/50">
            <div className="text-xs text-slate-400 font-bold mb-2 uppercase">
              Word {testWordIndex + 1} of {words.length}
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-wide mb-1">
              "{words[testWordIndex]?.word}"
            </h2>
            <div className="text-xs text-slate-500 font-semibold mb-6">
              [{words[testWordIndex]?.ipa || 'no ipa'}] | অর্থ: {words[testWordIndex]?.bangla_meaning}
            </div>

            <div className="flex flex-col items-center justify-center py-6">
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={isEvaluating}
                className={`w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md ${
                  recording
                    ? 'bg-red-500 scale-110 animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
                style={{ fontSize: '2rem' }}
              >
                {recording ? '🛑' : '🎙️'}
              </button>
              <div className="text-xs text-slate-500 mt-3 font-semibold">
                {recording ? 'শব্দটি বলুন (ছেড়ে দিলে মূল্যায়িত হবে)' : 'রেকর্ড করতে চেপে ধরে রাখুন'}
              </div>
            </div>

            {isEvaluating && (
              <div className="text-sm text-indigo-600 font-bold animate-pulse mt-4">
                Tutor Guide আপনার উচ্চারণ শুনছে...
              </div>
            )}

            {pronScore !== null && (
              <div className="max-w-md mx-auto p-4 rounded-xl bg-white border border-slate-200/80 mt-6 animate-bounce-in">
                <div className="flex items-center justify-between border-b pb-2 mb-2">
                  <span className="text-sm text-slate-500 font-semibold">AI Accuracy Score:</span>
                  <span className={`text-2xl font-black ${pronScore >= 60 ? 'text-green-500' : 'text-red-500'}`}>
                    {pronScore}%
                  </span>
                </div>
                <p className="text-sm text-slate-700 font-medium">{pronFeedback}</p>
                {recognizedText && (
                  <div className="text-xs text-slate-400 mt-2">
                    শনাক্ত শব্দ: <span className="italic font-bold text-slate-600">"{recognizedText}"</span>
                  </div>
                )}

                {pronScore >= 60 ? (
                  <button onClick={nextWordTest} className="glass-button mt-4 bg-green-500 text-white border-none">
                    Next Word (পরবর্তী শব্দ) ▶
                  </button>
                ) : (
                  <div className="text-xs text-red-500 mt-3 font-bold">
                    *দয়া করে আবার বলুন। পাশ করতে কমপক্ষে ৬০% স্কোর দরকার।
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: SENTENCE SPEAKING TEST */}
      {wizardStep === 4 && (
        <div className="space-y-6">
          <div className="card-card p-6 text-center bg-indigo-50/20 border border-indigo-200/50">
            <div className="text-xs text-indigo-400 font-bold mb-2 uppercase">
              Sentence Challenge {testPhraseIndex + 1} of {phrases.length}
            </div>
            <h2 className="text-2xl font-extrabold text-indigo-900 tracking-wide mb-2">
              "{phrases[testPhraseIndex]?.phrase_en}"
            </h2>
            <div className="text-sm text-slate-500 font-semibold mb-6">
              অর্থ: {phrases[testPhraseIndex]?.phrase_bn}
            </div>

            <div className="flex flex-col items-center justify-center py-6">
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={isEvaluating}
                className={`w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md ${
                  recording
                    ? 'bg-red-500 scale-110 animate-pulse'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
                style={{ fontSize: '2rem' }}
              >
                {recording ? '🛑' : '🎙️'}
              </button>
              <div className="text-xs text-slate-500 mt-3 font-semibold">
                {recording ? 'বাক্যটি বলুন (ছেড়ে দিলে মূল্যায়িত হবে)' : 'রেকর্ড করতে চেপে ধরে রাখুন'}
              </div>
            </div>

            {isEvaluating && (
              <div className="text-sm text-indigo-600 font-bold animate-pulse mt-4">
                Tutor Guide বাক্যটি বিশ্লেষণ করছে...
              </div>
            )}

            {pronScore !== null && (
              <div className="max-w-md mx-auto p-4 rounded-xl bg-white border border-slate-200/80 mt-6 animate-bounce-in">
                <div className="flex items-center justify-between border-b pb-2 mb-2">
                  <span className="text-sm text-slate-500 font-semibold">AI Sentence Accuracy:</span>
                  <span className={`text-2xl font-black ${pronScore >= 60 ? 'text-green-500' : 'text-red-500'}`}>
                    {pronScore}%
                  </span>
                </div>
                <p className="text-sm text-slate-700 font-medium">{pronFeedback}</p>
                {recognizedText && (
                  <div className="text-xs text-slate-400 mt-2">
                    শনাক্ত বাক্য: <span className="italic font-bold text-slate-600">"{recognizedText}"</span>
                  </div>
                )}

                {pronScore >= 60 ? (
                  <button onClick={nextPhraseTest} className="glass-button mt-4 bg-green-500 text-white border-none">
                    {testPhraseIndex < phrases.length - 1 ? 'Next Sentence' : 'Finish Lesson (লেসন শেষ করুন)'} ▶
                  </button>
                ) : (
                  <div className="text-xs text-red-500 mt-3 font-bold">
                    *দয়া করে আবার বলুন। পাশ করতে কমপক্ষে ৬০% স্কোর দরকার।
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 5: COMPLETED CELEBRATION */}
      {wizardStep === 5 && (
        <div className="space-y-6 text-center animate-fade-in py-8">
          <div className="text-7xl animate-bounce">🎉🏆</div>
          <h1 className="text-3xl font-black text-indigo-900 mt-4">লেসন সফলভাবে সম্পন্ন হয়েছে!</h1>
          <p className="text-slate-600 max-w-md mx-auto">
            আপনি আজকের লেসন সম্পূর্ণ করেছেন। এর মাধ্যমে আপনি ইংরেজি উচ্চারণে আরও এক ধাপ এগিয়ে গেলেন।
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto my-8">
            <div className="card-card p-4 bg-indigo-50 border border-indigo-200">
              <div className="text-slate-400 text-xs uppercase font-bold">XP Reward</div>
              <div className="text-3xl font-black text-indigo-600 mt-1">+50 XP</div>
            </div>
            <div className="card-card p-4 bg-emerald-50 border border-emerald-200">
              <div className="text-slate-400 text-xs uppercase font-bold">Your Status</div>
              <div className="text-3xl font-black text-emerald-600 mt-1">PASSED</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate('/curriculum')} className="glass-button" style={{ width: 'auto' }}>
              Return to Curriculum
            </button>
            <button onClick={() => navigate('/progress')} className="secondary-button" style={{ width: 'auto', padding: '0.85rem 1.25rem', borderRadius: '0.75rem' }}>
              View My Progress 📈
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

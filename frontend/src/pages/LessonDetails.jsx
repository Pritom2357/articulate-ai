import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLesson } from '../api/curriculum.js';
import { markLessonComplete, assessPronunciation } from '../api/progress.js';
import { getBookmarks, addBookmark, removeBookmark } from '../api/vocabulary.js';
import useAuth from '../hooks/useAuth.js';
import { Award, BookOpen, Volume2, ShieldAlert, Sparkles, Mic, Bookmark } from 'lucide-react';
import { speakText } from '../utils/tts.js';

// Import tutor assets
import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articulate_female.jpeg';

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
  const [bookmarkedWordIds, setBookmarkedWordIds] = useState(new Set());

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    async function loadLessonAndBookmarks() {
      try {
        setLoading(true);
        const result = await getLesson(id);
        setLesson(result.lesson);
        setWords(result.words || []);
        setPhrases(result.phrases || []);

        try {
          const bookmarks = await getBookmarks();
          setBookmarkedWordIds(new Set(bookmarks.map(b => b.word_id)));
        } catch (bErr) {
          console.error('Failed to load bookmarks', bErr);
        }
      } catch (err) {
        setError(err.payload?.error || err.message || 'লেসন লোড করতে সমস্যা হয়েছে।');
      } finally {
        setLoading(false);
      }
    }
    loadLessonAndBookmarks();
  }, [id]);

  // TTS pronunciation player
  const playTTS = (text, wordId = null) => {
    if ('speechSynthesis' in window) {
      speakText(
        text,
        activeTutor,
        () => {
          setIsSpeaking(true);
          if (wordId) setSpeakingWordId(wordId);
        },
        () => {
          setIsSpeaking(false);
          setSpeakingWordId(null);
        }
      );
    } else {
      alert('আপনার ব্রাউজার টেক্সট-টু-স্পিচ সাপোর্ট করে না।');
    }
  };

  const handleToggleBookmark = async (wordId) => {
    try {
      const isBookmarked = bookmarkedWordIds.has(wordId);
      if (isBookmarked) {
        await removeBookmark(wordId);
        setBookmarkedWordIds(prev => {
          const next = new Set(prev);
          next.delete(wordId);
          return next;
        });
      } else {
        await addBookmark(wordId);
        setBookmarkedWordIds(prev => {
          const next = new Set(prev);
          next.add(wordId);
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to toggle bookmark', err);
    }
  };

  // Recording methods with cross-browser type support
  const startRecording = async () => {
    setRecognizedText('');
    setPronScore(null);
    setPronFeedback('');
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      let options = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options = { mimeType: 'audio/webm' };
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options = { mimeType: 'audio/mp4' };
      }
      
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const type = options.mimeType || 'audio/wav';
        const extension = type.includes('mp4') ? 'mp4' : 'webm';
        const audioBlob = new Blob(audioChunksRef.current, { type });
        await uploadSpeechAttempt(audioBlob, extension);
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
      // Close mic tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const uploadSpeechAttempt = async (audioBlob, extension) => {
    setIsEvaluating(true);
    try {
      const isWordTest = wizardStep === 3;
      const refText = isWordTest ? words[testWordIndex].word : phrases[testPhraseIndex].phrase_en;
      
      const formData = new FormData();
      formData.append('audio', audioBlob, `attempt.${extension}`);
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
    return (
      <div className="page-container text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <div className="text-slate-400 font-semibold">লেসন লোড হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Lesson Header */}
      <div className="page-header border-b border-white/10 pb-4 mb-6">
        <div>
          <h1 className="page-title text-white flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
              <BookOpen className="text-indigo-400" size={24} />
            </span>
            {lesson?.title || `Lesson ${id}`}
          </h1>
          <p className="page-subtitle text-slate-400">{lesson?.title_bn}</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-white/5 border border-white/5 rounded-full px-3 py-1.5 font-bold text-slate-300">
          <span>🎯 লেসন ক্যাটাগরি:</span>
          <span className="text-indigo-400 uppercase">{lesson?.type}</span>
        </div>
      </div>

      {error && (
        <div className="glass-alert glass-alert-error mb-6 flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Visual Stepper */}
      <div className="flex justify-between items-center mb-6 p-2 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md overflow-x-auto gap-2 scrollbar-none">
        {[
          { step: 1, label: 'শব্দভান্ডার (Vocabulary)' },
          { step: 2, label: 'ফ্ল্যাশ-কার্ড প্র্যাকটিস' },
          { step: 3, label: 'শব্দ উচ্চারণ পরীক্ষা' },
          { step: 4, label: 'বাক্য উচ্চারণ পরীক্ষা' },
          { step: 5, label: 'লেসন সম্পন্ন! 🎉' }
        ].map((s) => (
          <div
            key={s.step}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              wizardStep === s.step
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : wizardStep > s.step
                ? 'text-indigo-400 bg-indigo-950/10'
                : 'text-slate-500'
            }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              wizardStep === s.step
                ? 'bg-white text-indigo-600'
                : wizardStep > s.step
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-white/5 text-slate-500'
            }`}>
              {s.step}
            </span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tutor Speech Bubble Area */}
      <div className="flex gap-4 p-4 rounded-2xl bg-slate-950/40 border border-white/10 mb-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none"></div>
        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500/30 flex-shrink-0 transition-all duration-300 ${isSpeaking ? 'scale-108 animate-pulse shadow-md' : ''}`}>
          <img src={tutorAvatar} alt="Tutor" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-indigo-400 text-sm">{tutorName} (গাইড)</div>
          <div className="text-sm text-slate-200 leading-relaxed mt-1.5 font-medium italic">
            {wizardStep === 1 && `"স্বাগতম! আজকে আমরা নতুন শব্দ শিখব। প্রতিটি শব্দ শুনুন এবং তা বাংলা অর্থের সাথে মুখস্থ করুন।"`}
            {wizardStep === 2 && `"এবার ফ্ল্যাশ-কার্ড দিয়ে প্র্যাকটিস করার পালা। কার্ডগুলো উল্টে তার বাংলা অর্থ মেলাবার চেষ্টা করুন।"`}
            {wizardStep === 3 && `"উচ্চারণ টেস্ট শুরু করা যাক! মাইক চেপে ধরে শব্দটি বলুন। কমপক্ষে ৬০% নির্ভুল হতে হবে।"`}
            {wizardStep === 4 && `"খুব ভালো করেছেন! এবার আমরা শব্দগুলো নিয়ে সম্পূর্ণ বাক্য বলব। মাইক চেপে পুরো বাক্যটি বলুন।"`}
            {wizardStep === 5 && `"অভিনন্দন! আপনার আজকের লেসনটি সম্পূর্ণ সফল হয়েছে। আপনার প্রোগ্রেস সেভ করা হয়েছে এবং আপনি ৫০ XP পেয়েছেন।"`}
          </div>
        </div>
      </div>

      {/* STEP 1: LEARN MODE */}
      {wizardStep === 1 && (
        <div className="space-y-6">
          <div className="card-card p-6 bg-slate-950/40 border border-white/10">
            <h2 className="card-title text-white mb-4 flex items-center gap-2">
              <span>📚</span> Vocabulary List (শব্দভান্ডার)
            </h2>
            <div className="space-y-3">
              {words.map((word) => (
                <div key={word.id} className="word-item flex items-center justify-between p-4 border border-white/5 rounded-xl bg-white/2 hover:bg-white/5 hover:border-white/10 transition">
                  <div>
                    <div className="font-extrabold text-white text-lg flex items-center gap-2">
                      {word.word}
                      {word.ipa && <span className="font-mono text-xs text-slate-400">[{word.ipa}]</span>}
                    </div>
                    <div className="text-sm text-slate-400 mt-1 font-semibold">অর্থ: {word.bangla_meaning}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleBookmark(word.id)}
                      className={`w-10 h-10 rounded-full border flex items-center justify-center cursor-pointer transition ${
                        bookmarkedWordIds.has(word.id)
                          ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                      }`}
                      title={bookmarkedWordIds.has(word.id) ? "সংরক্ষণ তালিকা থেকে বাদ দিন" : "সংরক্ষণ করুন"}
                    >
                      <Bookmark size={16} className={bookmarkedWordIds.has(word.id) ? 'fill-cyan-400' : ''} />
                    </button>
                    <button
                      onClick={() => playTTS(word.word, word.id)}
                      className={`w-10 h-10 rounded-full border-none flex items-center justify-center cursor-pointer transition ${
                        speakingWordId === word.id
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                      }`}
                      title="উচ্চারণ শুনুন"
                    >
                      <Volume2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setWizardStep(2)} className="glass-button w-full bg-gradient-to-r from-indigo-600 to-cyan-600">
            পরবর্তী ধাপ: ফ্ল্যাশ-কার্ড প্র্যাকটিস ▶
          </button>
        </div>
      )}

      {/* STEP 2: PRACTICE (FLASHCARDS) */}
      {wizardStep === 2 && (
        <div className="space-y-6 text-center">
          <div className="card-card p-6 bg-slate-950/40 border border-white/10 max-w-xl mx-auto">
            <div className="text-xs text-slate-400 font-bold mb-4 uppercase">
              শব্দ {practiceIndex + 1} / {words.length}
            </div>

            <div className="card-scene mx-auto" onClick={() => setIsCardFlipped(!isCardFlipped)}>
              <div className={`flip-card ${isCardFlipped ? 'is-flipped' : ''}`} style={{ height: '220px' }}>
                <div className="card-face card-face-front flex flex-col justify-center items-center">
                  <div className="text-3xl font-extrabold text-white">{words[practiceIndex]?.word}</div>
                  <div className="text-xs text-cyan-300 mt-6 font-semibold animate-pulse">ক্লিক করুন (অর্থ দেখতে) 🔄</div>
                </div>
                <div className="card-face card-face-back flex flex-col justify-center items-center">
                  <div className="text-2xl font-bold text-white mb-2">{words[practiceIndex]?.bangla_meaning}</div>
                  <div className="text-xs text-indigo-200 font-semibold font-mono">[{words[practiceIndex]?.ipa}]</div>
                  <div className="text-xs text-slate-400 mt-6 font-semibold">ফিরে যেতে ক্লিক করুন 🔄</div>
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
                ◀ পূর্ববর্তী
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
                {practiceIndex < words.length - 1 ? 'পরবর্তী শব্দ ▶' : 'পরবর্তী ধাপ: শব্দ টেস্ট ▶'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: WORD SPEAKING TEST */}
      {wizardStep === 3 && (
        <div className="space-y-6">
          <div className="card-card p-6 text-center bg-slate-950/40 border border-white/10 max-w-xl mx-auto">
            <div className="text-xs text-slate-400 font-bold mb-2 uppercase">
              শব্দ {testWordIndex + 1} / {words.length}
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-wide mb-1">
              "{words[testWordIndex]?.word}"
            </h2>
            <div className="text-xs text-slate-400 font-semibold mb-6">
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
                    ? 'bg-red-500 scale-110 animate-pulse shadow-lg shadow-red-500/40'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                <Mic size={32} />
              </button>
              <div className="text-xs text-slate-400 mt-4 font-semibold">
                {recording ? 'শব্দটি বলুন (ছেড়ে দিলে মূল্যায়িত হবে)' : 'রেকর্ড করতে বাটনে চেপে ধরে রাখুন'}
              </div>
            </div>

            {isEvaluating && (
              <div className="text-sm text-indigo-400 font-bold animate-pulse py-4 flex items-center justify-center gap-2">
                <Sparkles size={16} /> Tutor Guide আপনার উচ্চারণ বিশ্লেষণ করছে...
              </div>
            )}

            {pronScore !== null && (
              <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-900/60 border border-white/10 mt-6 animate-bounce-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                  <span className="text-sm text-slate-400 font-semibold">AI উচ্চারণ নির্ভুলতা:</span>
                  <span className={`text-2xl font-black ${pronScore >= 60 ? 'text-green-500' : 'text-red-500'}`}>
                    {pronScore}%
                  </span>
                </div>
                <p className="text-sm text-slate-200 font-medium">{pronFeedback}</p>
                {recognizedText && (
                  <div className="text-xs text-slate-400 mt-2">
                    শনাক্ত শব্দ: <span className="italic font-bold text-slate-300">"{recognizedText}"</span>
                  </div>
                )}

                {pronScore >= 60 ? (
                  <button onClick={nextWordTest} className="glass-button mt-4 bg-green-500 text-white border-none w-full">
                    {testWordIndex < words.length - 1 ? 'পরবর্তী শব্দ' : 'পরবর্তী ধাপ: বাক্য টেস্ট'} ▶
                  </button>
                ) : (
                  <div className="text-xs text-red-500 mt-3 font-bold">
                    *দয়া করে আবার বলুন। পাশ করতে কমপক্ষে ৬০% স্কোর প্রয়োজন।
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
          <div className="card-card p-6 text-center bg-slate-950/40 border border-white/10 max-w-xl mx-auto">
            <div className="text-xs text-slate-400 font-bold mb-2 uppercase">
              বাক্য চ্যালেঞ্জ {testPhraseIndex + 1} / {phrases.length}
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-wide mb-2">
              "{phrases[testPhraseIndex]?.phrase_en}"
            </h2>
            <div className="text-sm text-slate-400 font-semibold mb-6">
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
                    ? 'bg-red-500 scale-110 animate-pulse shadow-lg shadow-red-500/40'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                <Mic size={32} />
              </button>
              <div className="text-xs text-slate-400 mt-4 font-semibold">
                {recording ? 'বাক্যটি বলুন (ছেড়ে দিলে মূল্যায়িত হবে)' : 'রেকর্ড করতে বাটনে চেপে ধরে রাখুন'}
              </div>
            </div>

            {isEvaluating && (
              <div className="text-sm text-indigo-400 font-bold animate-pulse py-4 flex items-center justify-center gap-2">
                <Sparkles size={16} /> গাইড বাক্যটি বিশ্লেষণ করছে...
              </div>
            )}

            {pronScore !== null && (
              <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-900/60 border border-white/10 mt-6 animate-bounce-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                  <span className="text-sm text-slate-400 font-semibold">AI উচ্চারণ নির্ভুলতা:</span>
                  <span className={`text-2xl font-black ${pronScore >= 60 ? 'text-green-500' : 'text-red-500'}`}>
                    {pronScore}%
                  </span>
                </div>
                <p className="text-sm text-slate-200 font-medium">{pronFeedback}</p>
                {recognizedText && (
                  <div className="text-xs text-slate-400 mt-2">
                    শনাক্ত বাক্য: <span className="italic font-bold text-slate-300">"{recognizedText}"</span>
                  </div>
                )}

                {pronScore >= 60 ? (
                  <button onClick={nextPhraseTest} className="glass-button mt-4 bg-green-500 text-white border-none w-full">
                    {testPhraseIndex < phrases.length - 1 ? 'পরবর্তী বাক্য' : 'লেসন শেষ করুন'} ▶
                  </button>
                ) : (
                  <div className="text-xs text-red-500 mt-3 font-bold">
                    *দয়া করে আবার বলুন। পাশ করতে কমপক্ষে ৬০% স্কোর প্রয়োজন।
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 5: COMPLETED CELEBRATION */}
      {wizardStep === 5 && (
        <div className="space-y-6 text-center animate-fade-in py-8 relative overflow-hidden">
          {/* Decorative glow orbs */}
          <div className="absolute top-0 left-1/4 w-40 h-40 bg-indigo-500/10 rounded-full filter blur-3xl pointer-events-none animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-cyan-500/10 rounded-full filter blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>

          <div className="text-7xl animate-bounce">🎉🏆</div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-400 to-indigo-400 mt-4">
            লেসন সফলভাবে সম্পন্ন হয়েছে!
          </h1>
          <p className="text-slate-300 max-w-md mx-auto font-medium leading-relaxed">
            আপনি আজকের লেসন সম্পূর্ণ করেছেন। এর মাধ্যমে আপনি ইংরেজি উচ্চারণে আরও এক ধাপ এগিয়ে গেলেন।
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto my-8">
            <div className="card-card p-5 bg-gradient-to-br from-indigo-950/40 to-slate-950/40 border border-indigo-500/25 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full filter blur-xl pointer-events-none"></div>
              <div className="text-slate-400 text-xs uppercase font-bold tracking-wider">এক্সপি পুরস্কার</div>
              <div className="text-3xl font-black text-indigo-400 mt-1.5">+50 XP</div>
            </div>
            <div className="card-card p-5 bg-gradient-to-br from-emerald-950/40 to-slate-950/40 border border-emerald-500/25 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full filter blur-xl pointer-events-none"></div>
              <div className="text-slate-400 text-xs uppercase font-bold tracking-wider">আপনার ফলাফল</div>
              <div className="text-3xl font-black text-emerald-400 mt-1.5">পাস ✅</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={() => navigate('/curriculum')} className="glass-button w-auto">
              কারিকুলামে ফিরে যান
            </button>
            <button onClick={() => navigate('/progress')} className="secondary-button w-auto" style={{ padding: '0.85rem 1.25rem', borderRadius: '0.75rem' }}>
              প্রোগ্রেস দেখুন 📈
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

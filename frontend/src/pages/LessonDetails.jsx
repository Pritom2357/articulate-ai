import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLesson } from '../api/curriculum.js';
import { markLessonComplete, assessPronunciation, getPronunciationFeedback } from '../api/progress.js';
import { getBookmarks, addBookmark, removeBookmark } from '../api/vocabulary.js';
import useAuth from '../hooks/useAuth.js';
import { Award, BookOpen, Volume2, ShieldAlert, Sparkles, Mic, Bookmark, TrendingUp } from 'lucide-react';
import { playWordAudio } from '../utils/playWordAudio.js';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';

// Import tutor assets
import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articulate_female.jpeg';

export default function LessonDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { t, language } = useThemeLanguage();

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
  const tutorName = activeTutor === 'FEMALE'
    ? (language === 'bn' ? 'Riya (রিয়া)' : 'Riya')
    : (language === 'bn' ? 'Rohit (রোহিত)' : 'Rohit');

  // TTS speaking states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingWordId, setSpeakingWordId] = useState(null);

  // Step 1: Learn mode pagination
  const [learnIndex, setLearnIndex] = useState(0);

  // Step 2: Mini Flashcard practice states
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [flippedCards, setFlippedCards] = useState(new Set());

  // Step 3 & 4: Recording and Pronunciation Assessment States
  const [testWordIndex, setTestWordIndex] = useState(0);
  const [testPhraseIndex, setTestPhraseIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [pronScore, setPronScore] = useState(null);
  const [pronFeedback, setPronFeedback] = useState('');
  const [recognizedText, setRecognizedText] = useState('');
  const [passCount, setPassCount] = useState(0);
  const [pronunciationTip, setPronunciationTip] = useState('');
  const [phonemeScores, setPhonemeScores] = useState([]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [bookmarkedWordIds, setBookmarkedWordIds] = useState(new Set());
  const [wordScores, setWordScores] = useState({});
  const [phraseScores, setPhraseScores] = useState({});

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
        setError(err.payload?.error || err.message || (language === 'bn' ? 'লেসন লোড করতে সমস্যা হয়েছে।' : 'Failed to load lesson.'));
      } finally {
        setLoading(false);
      }
    }
    loadLessonAndBookmarks();
  }, [id]);

  const clearRecordedAudio = () => {
    setRecordedAudioUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const goToStep = (step) => {
    setPronScore(null);
    setPronFeedback('');
    setRecognizedText('');
    setPronunciationTip('');
    setPhonemeScores([]);
    clearRecordedAudio();
    setWizardStep(step);
  };

  const handlePlayAudio = async (item, wordId = null) => {
    await playWordAudio(
      item,
      activeTutor,
      () => { setIsSpeaking(true); if (wordId) setSpeakingWordId(wordId); },
      () => { setIsSpeaking(false); setSpeakingWordId(null); }
    );
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
    setPronunciationTip('');
    setPhonemeScores([]);
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
      alert(language === 'bn' ? 'মাইক্রোফোন চালু করা যায়নি। অনুগ্রহ করে পারমিশন চেক করুন।' : 'Could not activate microphone. Please check permissions.');
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

  const playRecordedAudio = () => {
    if (!recordedAudioUrl) return;
    const audio = new Audio(recordedAudioUrl);
    setIsPlayingRecording(true);
    audio.onended = () => setIsPlayingRecording(false);
    audio.onerror = () => setIsPlayingRecording(false);
    audio.play();
  };

  const uploadSpeechAttempt = async (audioBlob, extension) => {
    setIsEvaluating(true);
    const rawUrl = URL.createObjectURL(audioBlob);
    setRecordedAudioUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return rawUrl;
    });
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

      setPronunciationTip('');
      setPhonemeScores([]);
      const response = await assessPronunciation(formData);

      if (response.rejected) {
        setPronScore(0);
        setPronFeedback(language === 'bn' ? 'রেকর্ডিংয়ের শব্দ স্পষ্ট নয়। অনুগ্রহ করে শান্ত জায়গায় আবার রেকর্ড করুন।' : 'The recorded audio is not clear. Please record again in a quiet place.');
        return;
      }

      setRecognizedText(response.recognized_text || '');
      setPronScore(response.overall_score);
      setPronFeedback(response.feedback);
      setPhonemeScores(response.phonemes || []);

      // The backend runs the recording through a denoiser before scoring it — once that comes
      // back, swap the playback source to it so "your recording" is the cleaned-up version
      // actually used for scoring, not the raw mic capture.
      if (response.denoised_audio_url) {
        URL.revokeObjectURL(rawUrl);
        setRecordedAudioUrl(response.denoised_audio_url);
      }

      if (response.overall_score !== undefined && response.overall_score !== null) {
        if (isWordTest) {
          setWordScores(prev => ({...prev, [testWordIndex]: Math.max(prev[testWordIndex] || 0, response.overall_score)}));
          saveScoreToHistory(`word_${words[testWordIndex].id}`, response.overall_score);
        } else {
          setPhraseScores(prev => ({...prev, [testPhraseIndex]: Math.max(prev[testPhraseIndex] || 0, response.overall_score)}));
        }
      }

      if (response.overall_score >= 60) {
        setPassCount(prev => prev + 1);
      }

      // Fire-and-forget: fetch the Bangla phoneme tip in the background so the score above never waits on the LLM.
      if (response.phonemes && response.phonemes.length > 0) {
        getPronunciationFeedback(response.phonemes.map(p => ({ phoneme: p.phoneme, score: p.score })))
          .then(fb => setPronunciationTip(fb.tipBn || ''))
          .catch(err => console.error('Pronunciation feedback fetch failed', err));
      }
    } catch (err) {
      console.error('Speech assessment error:', err);
      setPronScore(0);
      setPronFeedback(language === 'bn' ? 'মূল্যায়ন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' : 'Evaluation failed. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const nextWordTest = () => {
    setPronScore(null);
    setPronFeedback('');
    setRecognizedText('');
    setPronunciationTip('');
    setPhonemeScores([]);
    clearRecordedAudio();
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
    setPronunciationTip('');
    setPhonemeScores([]);
    clearRecordedAudio();
    if (testPhraseIndex < phrases.length - 1) {
      setTestPhraseIndex(prev => prev + 1);
    } else {
      completeLesson();
    }
  };

  const completeLesson = async () => {
    try {
      setLoading(true);
      const wordWeight = 1;
      const phraseWeight = 2;

      let totalWeightedScore = 0;
      Object.values(wordScores).forEach(s => totalWeightedScore += s * wordWeight);
      Object.values(phraseScores).forEach(s => totalWeightedScore += s * phraseWeight);

      const totalWeight = (words.length * wordWeight) + (phrases.length * phraseWeight);
      const avgScore = totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 100;

      await markLessonComplete({ lessonId: id, score: avgScore });
      await refreshUser();
      setWizardStep(5);
    } catch (err) {
      setError(language === 'bn' ? 'প্রোগ্রেস সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save progress.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !lesson) {
    return (
      <div className="page-container text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <div className="text-slate-400 font-semibold">{t('lesson_loading')}</div>
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
            {lesson?.title || `Lesson ${lesson?.order_num || id}`}
          </h1>
          <p className="page-subtitle text-slate-400">{language === 'bn' ? lesson?.title_bn : lesson?.title}</p>
        </div>
        <div className="flex items-center gap-2 text-xs bg-white/5 border border-white/5 rounded-full px-3 py-1.5 font-bold text-slate-300">
          <span>🎯 {language === 'bn' ? 'লেসন ক্যাটাগরি:' : 'Lesson Category:'}</span>
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
          { step: 1, label: t('step_vocab') },
          { step: 2, label: t('step_flash') },
          { step: 3, label: t('step_word') },
          { step: 4, label: t('step_sentence') },
          { step: 5, label: t('step_complete') }
        ].map((s) => (
          <button
            key={s.step}
            onClick={() => goToStep(s.step)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border-none ${wizardStep === s.step
              ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
              : wizardStep > s.step
                ? 'text-indigo-400 bg-indigo-950/10 hover:bg-indigo-950/20'
                : 'text-slate-500 bg-transparent hover:bg-white/5 hover:text-slate-300'
              }`}
          >
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${wizardStep === s.step
              ? 'bg-white text-indigo-600'
              : wizardStep > s.step
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-white/5 text-slate-500'
              }`}>
              {s.step}
            </span>
            <span>{s.label}</span>
          </button>
        ))}
      </div>

      {/* Tutor Speech Bubble Area */}
      <div className="flex gap-4 p-4 rounded-2xl bg-slate-950/40 border border-white/10 mb-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none"></div>
        <div className={`w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500/30 flex-shrink-0 transition-all duration-300 ${isSpeaking ? 'scale-108 animate-pulse shadow-md' : ''}`}>
          <img src={tutorAvatar} alt="Tutor" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="font-bold text-indigo-400 text-sm">{tutorName} ({t('lesson_tutor')})</div>
          <div className="text-sm text-slate-200 leading-relaxed mt-1.5 font-medium italic">
            {wizardStep === 1 && (language === 'bn' 
              ? `"স্বাগতম! আজকে আমরা নতুন শব্দ শিখব। প্রতিটি শব্দ শুনুন এবং তা বাংলা অর্থের সাথে মুখস্থ করুন।"` 
              : `"Welcome! Today we will learn new vocabulary. Listen to each word and memorize it along with its meaning."`)}
            {wizardStep === 2 && (language === 'bn'
              ? `"এবার ফ্ল্যাশ-কার্ড দিয়ে প্র্যাকটিস করার পালা। কার্ডগুলো উল্টে তার বাংলা অর্থ মেলাবার চেষ্টা করুন।"`
              : `"Now it's time to practice with flashcards. Flip the cards to match their meanings."`)}
            {wizardStep === 3 && (language === 'bn'
              ? `"উচ্চারণ টেস্ট শুরু করা যাক! মাইক চেপে ধরে শব্দটি বলুন। কমপক্ষে ৬০% নির্ভুল হতে হবে।"`
              : `"Let's start the pronunciation test! Press and hold the mic to say the word. You need at least 60% accuracy to pass."`)}
            {wizardStep === 4 && (language === 'bn'
              ? `"খুব ভালো করেছেন! এবার আমরা শব্দগুলো নিয়ে সম্পূর্ণ বাক্য বলব। মাইক চেপে পুরো বাক্যটি বলুন।"`
              : `"Excellent job! Now let's practice full sentences using these words. Press and hold the mic to speak."`)}
            {wizardStep === 5 && (language === 'bn'
              ? `"অভিনন্দন! আপনার আজকের লেসনটি সম্পূর্ণ সফল হয়েছে। আপনার প্রোগ্রেস সেভ করা হয়েছে এবং আপনি ৫০ XP পেয়েছেন।"`
              : `"Congratulations! You have successfully completed today's lesson. Your progress has been saved and you earned 50 XP."`)}
          </div>
        </div>
      </div>

      {/* STEP 1: LEARN MODE — 3 cards at a time */}
      {wizardStep === 1 && (() => {
        const isLastPage = learnIndex + 3 >= words.length;
        const totalPages = Math.ceil(words.length / 3);
        const currentPage = Math.floor(learnIndex / 3) + 1;

        return (
          <div className="space-y-5">
            <div className="text-center text-xs text-slate-500 font-bold uppercase tracking-widest">
              {currentPage} / {totalPages}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[0, 1, 2].map(offset => {
                const word = words[learnIndex + offset];
                if (!word) return null;
                return (
                  <div key={word.id} className="flex flex-col gap-3 p-5 rounded-2xl bg-slate-950/50 border border-white/10">
                    {/* Row 1: word (left) — IPA (right) */}
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-xl font-black text-white">{word.word}</div>
                      {word.ipa && (
                        <div className="text-xs text-slate-400 font-mono shrink-0">[{word.ipa}]</div>
                      )}
                    </div>

                    {/* Row 2: bangla meaning centered */}
                    <div className="text-center text-sm text-slate-200 font-semibold border-t border-white/5 pt-3">
                      {word.bangla_meaning}
                    </div>

                    {/* Row 3: audio + bookmark */}
                    <div className="flex items-center gap-2 pt-1 border-t border-white/5 mt-auto">
                      <button
                        onClick={() => handlePlayAudio(word, word.id)}
                        className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${speakingWordId === word.id
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                          }`}
                      >
                        <Volume2 size={13} />
                        {speakingWordId === word.id ? t('vocab_playing') : t('vocab_listen')}
                      </button>
                      <button
                        onClick={() => handleToggleBookmark(word.id)}
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition ${bookmarkedWordIds.has(word.id)
                          ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                          }`}
                      >
                        <Bookmark size={13} className={bookmarkedWordIds.has(word.id) ? 'fill-cyan-400' : ''} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-4 mt-4">
              {learnIndex > 0 && (
                <button
                  onClick={() => setLearnIndex(prev => Math.max(0, prev - 3))}
                  className="glass-button w-full bg-slate-800 text-slate-300 border-none hover:bg-slate-700"
                >
                  {t('btn_prev_words')}
                </button>
              )}
              <button
                onClick={() => isLastPage ? setWizardStep(2) : setLearnIndex(prev => prev + 3)}
                className="glass-button w-full bg-gradient-to-r from-indigo-600 to-cyan-600 border-none"
              >
                {isLastPage ? t('btn_next_step_flash') : t('btn_next_words')}
              </button>
            </div>
          </div>
        );
      })()}

      {/* STEP 2: PRACTICE (FLASHCARDS — 2 at a time) */}
      {wizardStep === 2 && (() => {
        const pairDone = [0, 1].every(offset => {
          const idx = practiceIndex + offset;
          return idx >= words.length || flippedCards.has(idx);
        });
        const isLastPair = practiceIndex + 2 >= words.length;
        const totalPairs = Math.ceil(words.length / 2);
        const currentPair = Math.floor(practiceIndex / 2) + 1;

        return (
          <div className="space-y-6">
            <div className="text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
              {t('flash_page')} {currentPair} / {totalPairs}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {[0, 1].map(offset => {
                const idx = practiceIndex + offset;
                const word = words[idx];
                if (!word) return null;
                const isFlipped = flippedCards.has(idx);
                return (
                  <div key={word.id} className="card-card p-4 bg-slate-950/40 border border-white/10">
                    <div
                      className="card-scene mx-auto cursor-pointer"
                      onClick={() => setFlippedCards(prev => new Set([...prev, idx]))}
                    >
                      <div className={`flip-card ${isFlipped ? 'is-flipped' : ''}`} style={{ height: '190px' }}>
                        <div className="card-face card-face-front flex flex-col justify-center items-center px-4">
                          <div className="text-2xl font-extrabold text-white text-center">{word.word}</div>
                          {word.ipa && (
                            <div className="text-xs text-slate-400 font-mono mt-1">[{word.ipa}]</div>
                          )}
                          <div className="text-xs text-cyan-300 mt-5 font-semibold animate-pulse">{t('flash_tap_to_flip')}</div>
                        </div>
                        <div className="card-face card-face-back flex flex-col justify-center items-center px-4">
                          <div className="text-xl font-bold text-white text-center mb-1">{word.bangla_meaning}</div>
                          {word.ipa && (
                            <div className="text-xs text-indigo-200 font-mono">[{word.ipa}]</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {pairDone && (
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    if (isLastPair) {
                      setWizardStep(3);
                    } else {
                      setPracticeIndex(prev => prev + 2);
                    }
                  }}
                  className="form-button"
                >
                  {isLastPair ? t('btn_next_step_word') : t('btn_next_2_words')}
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* STEP 3: WORD SPEAKING TEST */}
      {wizardStep === 3 && (
        <div className="space-y-6">
          <div className="card-card p-6 text-center bg-slate-950/40 border border-white/10 max-w-xl mx-auto">
            <div className="text-xs text-slate-400 font-bold mb-2 uppercase">
              {language === 'bn' ? 'শব্দ' : 'Word'} {testWordIndex + 1} / {words.length}
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6 mt-4">
              <div className="text-center md:text-left flex-1">
                <h2 className="text-3xl font-extrabold text-white tracking-wide mb-1">
                  "{words[testWordIndex]?.word}"
                </h2>
                <div className="text-xs text-slate-400 font-semibold">
                  [{words[testWordIndex]?.ipa || 'no ipa'}] | {language === 'bn' ? 'অর্থ:' : 'Meaning:'} {words[testWordIndex]?.bangla_meaning}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center min-w-[140px]">
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  disabled={isEvaluating}
                  className={`w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md ${recording
                    ? 'bg-red-500 scale-110 animate-pulse shadow-lg shadow-red-500/40'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                >
                  <Mic size={32} />
                </button>
                <div className="text-[10px] text-slate-400 mt-2 font-semibold text-center leading-tight">
                  {recording ? t('mic_release_to_evaluate') : t('mic_hold_to_record')}
                </div>
              </div>
            </div>

            {isEvaluating && (
              <div className="text-sm text-indigo-400 font-bold animate-pulse py-4 flex items-center justify-center gap-2">
                <Sparkles size={16} /> {t('mic_evaluating')}
              </div>
            )}

            {pronScore !== null && (
              <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-900/60 border border-white/10 mt-6 animate-bounce-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                  <span className="text-sm text-slate-400 font-semibold">{t('mic_accuracy')}</span>
                  <span className={`text-2xl font-black ${pronScore >= 60 ? 'text-green-500' : 'text-red-500'}`}>
                    {pronScore}%
                  </span>
                </div>
                <p className="text-sm text-slate-200 font-medium">{pronFeedback}</p>
                {recognizedText && (
                  <div className="text-xs text-slate-400 mt-2">
                    {t('mic_recognized')} <span className="italic font-bold text-slate-300">"{recognizedText}"</span>
                  </div>
                )}
                {pronunciationTip && (
                  <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg p-2 mt-3 flex items-start gap-1.5">
                    <Sparkles size={13} className="mt-0.5 shrink-0" />
                    <span>{pronunciationTip}</span>
                  </div>
                )}

                {phonemeScores.length > 0 && (
                  <div className="mt-3 text-left">
                    <div className="text-xs text-slate-400 font-semibold mb-1.5">{t('mic_tips')}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {phonemeScores.map((p, i) => (
                        <span
                          key={i}
                          title={`${p.word}: ${p.score}%`}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border ${p.score >= 80
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : p.score >= 60
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}
                        >
                          /{p.phoneme}/ {p.score}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {recordedAudioUrl && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={playRecordedAudio}
                      className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${isPlayingRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        }`}
                    >
                      <Mic size={13} />
                      {isPlayingRecording ? t('vocab_playing') : t('mic_your_recording')}
                    </button>
                    <button
                      onClick={() => handlePlayAudio(words[testWordIndex], words[testWordIndex]?.id)}
                      className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${speakingWordId === words[testWordIndex]?.id
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                        }`}
                    >
                      <Volume2 size={13} />
                      {t('mic_correct_pron')}
                    </button>
                  </div>
                )}

                {pronScore >= 60 ? (
                  <button onClick={nextWordTest} className="glass-button mt-4 bg-green-500 text-white border-none w-full">
                    {testWordIndex < words.length - 1 ? t('mic_next_word') : t('mic_next_sentence')} ▶
                  </button>
                ) : (
                  <div className="text-xs text-red-500 mt-3 font-bold">
                    {t('mic_retry')}
                  </div>
                )}

                {/* Pronunciation Score Sparkline */}
                <PronSparkline
                  wordId={`word_${words[testWordIndex]?.id}`}
                  latestScore={pronScore}
                  language={language}
                />
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
              {language === 'bn' ? 'বাক্য চ্যালেঞ্জ' : 'Sentence Challenge'} {testPhraseIndex + 1} / {phrases.length}
            </div>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-6 mt-4">
              <div className="text-center md:text-left flex-1">
                <h2 className="text-2xl font-extrabold text-white tracking-wide mb-2">
                  "{phrases[testPhraseIndex]?.phrase_en}"
                </h2>
                <div className="text-sm text-slate-400 font-semibold">
                  {language === 'bn' ? 'অর্থ:' : 'Meaning:'} {phrases[testPhraseIndex]?.phrase_bn}
                </div>
              </div>

              <div className="flex flex-col items-center justify-center min-w-[140px]">
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  disabled={isEvaluating}
                  className={`w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md ${recording
                    ? 'bg-red-500 scale-110 animate-pulse shadow-lg shadow-red-500/40'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                >
                  <Mic size={32} />
                </button>
                <div className="text-[10px] text-slate-400 mt-2 font-semibold text-center leading-tight">
                  {recording ? t('mic_release_to_evaluate') : t('mic_hold_to_record')}
                </div>
              </div>
            </div>

            {isEvaluating && (
              <div className="text-sm text-indigo-400 font-bold animate-pulse py-4 flex items-center justify-center gap-2">
                <Sparkles size={16} /> {t('mic_evaluating')}
              </div>
            )}

            {pronScore !== null && (
              <div className="max-w-md mx-auto p-4 rounded-xl bg-slate-900/60 border border-white/10 mt-6 animate-bounce-in">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
                  <span className="text-sm text-slate-400 font-semibold">{t('mic_accuracy')}</span>
                  <span className={`text-2xl font-black ${pronScore >= 60 ? 'text-green-500' : 'text-red-500'}`}>
                    {pronScore}%
                  </span>
                </div>
                <p className="text-sm text-slate-200 font-medium">{pronFeedback}</p>
                {recognizedText && (
                  <div className="text-xs text-slate-400 mt-2">
                    {language === 'bn' ? 'শনাক্ত বাক্য:' : 'Recognized sentence:'} <span className="italic font-bold text-slate-300">"{recognizedText}"</span>
                  </div>
                )}

                {phonemeScores.length > 0 && (
                  <div className="mt-3 text-left">
                    <div className="text-xs text-slate-400 font-semibold mb-1.5">{t('mic_tips')}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {phonemeScores.map((p, i) => (
                        <span
                          key={i}
                          title={`${p.word}: ${p.score}%`}
                          className={`text-xs font-bold px-2 py-1 rounded-lg border ${p.score >= 80
                            ? 'bg-green-500/10 text-green-400 border-green-500/20'
                            : p.score >= 60
                              ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}
                        >
                          /{p.phoneme}/ {p.score}%
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {recordedAudioUrl && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={playRecordedAudio}
                      className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${isPlayingRecording
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                        }`}
                    >
                      <Mic size={13} />
                      {isPlayingRecording ? t('vocab_playing') : t('mic_your_recording')}
                    </button>
                    <button
                      onClick={() => handlePlayAudio(phrases[testPhraseIndex], phrases[testPhraseIndex]?.id)}
                      className={`flex-1 h-9 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${speakingWordId === phrases[testPhraseIndex]?.id
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20'
                        }`}
                    >
                      <Volume2 size={13} />
                      {t('mic_correct_pron')}
                    </button>
                  </div>
                )}

                {pronScore >= 60 ? (
                  <button onClick={nextPhraseTest} className="glass-button mt-4 bg-green-500 text-white border-none w-full">
                    {testPhraseIndex < phrases.length - 1 ? t('mic_next_sentence') : (language === 'bn' ? 'লেসন শেষ করুন' : 'Finish Lesson')} ▶
                  </button>
                ) : (
                  <div className="text-xs text-red-500 mt-3 font-bold">
                    {t('mic_retry')}
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
            {t('cel_title')}
          </h1>
          <p className="text-slate-300 max-w-md mx-auto font-medium leading-relaxed">
            {t('cel_desc')}
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto my-8">
            <div className="card-card p-5 bg-gradient-to-br from-indigo-950/40 to-slate-950/40 border border-indigo-500/25 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full filter blur-xl pointer-events-none"></div>
              <div className="text-slate-400 text-xs uppercase font-bold tracking-wider">{t('cel_xp_reward')}</div>
              <div className="text-3xl font-black text-indigo-400 mt-1.5">+50 XP</div>
            </div>
            <div className="card-card p-5 bg-gradient-to-br from-emerald-950/40 to-slate-950/40 border border-emerald-500/25 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full filter blur-xl pointer-events-none"></div>
              <div className="text-slate-400 text-xs uppercase font-bold tracking-wider">{t('cel_result')}</div>
              <div className="text-3xl font-black text-emerald-400 mt-1.5">{t('cel_pass')}</div>
            </div>
          </div>

          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={() => navigate('/curriculum')} className="glass-button w-auto">
              {t('cel_back_curr')}
            </button>
            <button onClick={() => navigate('/progress')} className="secondary-button w-auto" style={{ padding: '0.85rem 1.25rem', borderRadius: '0.75rem' }}>
              {t('cel_view_prog')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';
import { getDueFlashcards, reviewFlashcard } from '../api/progress.js';
import useAuth from '../hooks/useAuth.js';
import { Award, Volume2, Sparkles, ShieldAlert, RotateCcw } from 'lucide-react';
import { playWordAudio } from '../utils/playWordAudio.js';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';

import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articulate_female.jpeg';

// ─── Confidence buttons config ────────────────────────────────────────────────
const CONFIDENCE_LEVELS = [
  { label: 'Again',  labelBn: 'আবার',   emoji: '😰', score: 1,  color: 'bg-red-500/15 hover:bg-red-500/30 text-red-400 border-red-500/30' },
  { label: 'Hard',   labelBn: 'কঠিন',   emoji: '🤔', score: 50, color: 'bg-orange-500/15 hover:bg-orange-500/30 text-orange-400 border-orange-500/30' },
  { label: 'Good',   labelBn: 'ঠিক আছে', emoji: '😊', score: 70, color: 'bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-400 border-indigo-500/30' },
  { label: 'Easy',   labelBn: 'সহজ',    emoji: '🚀', score: 90, color: 'bg-green-500/15 hover:bg-green-500/30 text-green-400 border-green-500/30' },
];

// ─── CSS Confetti ─────────────────────────────────────────────────────────────
function Confetti() {
  const colors = ['#6366f1', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899', '#a78bfa'];
  const pieces = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    color: colors[i % colors.length],
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 1.5}s`,
    duration: `${1.5 + Math.random() * 1.5}s`,
    size: `${6 + Math.random() * 8}px`,
    rotate: `${Math.random() * 720}deg`,
  }));

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
      {pieces.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: p.left,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: '2px',
            animation: `confetti-fall ${p.duration} ${p.delay} ease-in forwards`,
            transform: `rotate(${p.rotate})`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// ─── Session Summary Screen ───────────────────────────────────────────────────
function SessionSummary({ sessionData, language, tutorName, tutorAvatar, onRestart }) {
  const { total, byConfidence } = sessionData;
  const avgConf = total > 0
    ? Math.round(Object.entries(byConfidence).reduce((sum, [score, count]) => sum + Number(score) * count, 0) / total)
    : 0;

  return (
    <>
      <Confetti />
      <div className="page-container animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
        <div className="card-card p-8 max-w-md w-full text-center bg-gradient-to-br from-indigo-950/30 to-slate-950/50 border border-indigo-500/25 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full filter blur-2xl pointer-events-none" />

          {/* Tutor */}
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-4 border-2 border-indigo-500/40 shadow-lg">
            <img src={tutorAvatar} alt="Tutor" className="w-full h-full object-cover" />
          </div>
          <div className="font-extrabold text-white text-lg mb-1">🎉 {language === 'bn' ? 'সেশন সম্পন্ন!' : 'Session Complete!'}</div>
          <p className="text-xs text-slate-400 mb-6 font-semibold italic">
            {language === 'bn'
              ? `"চমৎকার! আপনি আজকের সব ফ্ল্যাশকার্ড রিভিশন শেষ করেছেন।"`
              : `"${tutorName}: Excellent! You've completed all your flashcards for today."`}
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
              <div className="text-2xl font-black text-white">{total}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">{language === 'bn' ? 'মোট কার্ড' : 'Cards'}</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
              <div className="text-2xl font-black text-green-400">{byConfidence[90] || 0}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">{language === 'bn' ? 'সহজ 🚀' : 'Easy 🚀'}</div>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
              <div className="text-2xl font-black text-red-400">{byConfidence[1] || 0}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase">{language === 'bn' ? 'আবার 😰' : 'Again 😰'}</div>
            </div>
          </div>

          {/* Confidence bar */}
          <div className="mb-6">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
              <span>{language === 'bn' ? 'গড় আত্মবিশ্বাস' : 'Avg. confidence'}</span>
              <span className={avgConf >= 70 ? 'text-green-400' : avgConf >= 50 ? 'text-orange-400' : 'text-red-400'}>{avgConf}%</span>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${avgConf >= 70 ? 'bg-gradient-to-r from-indigo-500 to-green-500' : avgConf >= 50 ? 'bg-orange-500' : 'bg-red-500'}`}
                style={{ width: `${avgConf}%` }}
              />
            </div>
          </div>

          <button
            onClick={onRestart}
            className="glass-button w-full bg-gradient-to-r from-indigo-600 to-cyan-600 border-none flex items-center justify-center gap-2"
          >
            <RotateCcw size={14} /> {language === 'bn' ? 'আবার শুরু করুন' : 'Review Again'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main Flashcards Component ────────────────────────────────────────────────
export default function Flashcards() {
  const { user } = useAuth();
  const { language } = useThemeLanguage();
  const [cards, setCards] = useState([]);
  const [originalCards, setOriginalCards] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [sessionData, setSessionData] = useState({ total: 0, byConfidence: {} });

  const activeTutor = user?.guide_preference || 'MALE';
  const tutorAvatar = activeTutor === 'FEMALE' ? femaleAvatar : maleAvatar;
  const tutorName = activeTutor === 'FEMALE'
    ? (language === 'bn' ? 'Riya (রিয়া)' : 'Riya')
    : (language === 'bn' ? 'Rohit (রোহিত)' : 'Rohit');

  useEffect(() => {
    loadCards();
  }, []);

  async function loadCards() {
    try {
      const dueCards = await getDueFlashcards();
      setCards(dueCards || []);
      setOriginalCards(dueCards || []);
      setSelectedIndex(0);
      setIsFlipped(false);
      setSessionDone(false);
      setSessionData({ total: 0, byConfidence: {} });
    } catch (err) {
      setError(err.payload?.error || err.message || (language === 'bn' ? 'ফ্ল্যাশ-কার্ড লোড করা যায়নি।' : 'Failed to load flashcards.'));
    }
  }

  const handlePlayAudio = async (card, e) => {
    if (e) e.stopPropagation();
    await playWordAudio(card, activeTutor, () => setIsSpeaking(true), () => setIsSpeaking(false));
  };

  async function handleReview(confidenceLevel) {
    const card = cards[selectedIndex];
    if (!card) return;
    const { score, label, emoji } = confidenceLevel;

    try {
      setError('');
      setFeedback('');
      await reviewFlashcard({ wordId: card.word_id || card.id, score });

      // Update session data
      setSessionData(prev => ({
        total: prev.total + 1,
        byConfidence: { ...prev.byConfidence, [score]: (prev.byConfidence[score] || 0) + 1 },
      }));

      setFeedback(`${emoji} ${label}`);
      setIsFlipped(false);

      setTimeout(() => {
        const nextIndex = selectedIndex + 1;
        if (nextIndex >= cards.length) {
          // Session finished
          setSessionDone(true);
        } else {
          setSelectedIndex(nextIndex);
          setFeedback('');
        }
      }, 900);
    } catch (err) {
      setError(err.payload?.error || err.message || (language === 'bn' ? 'রিভিউ সংরক্ষণ ব্যর্থ হয়েছে।' : 'Failed to save review.'));
    }
  }

  const currentCard = cards[selectedIndex];

  if (sessionDone) {
    return (
      <SessionSummary
        sessionData={sessionData}
        language={language}
        tutorName={tutorName}
        tutorAvatar={tutorAvatar}
        onRestart={loadCards}
      />
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header border-b border-white/10 pb-4 mb-6">
        <div>
          <h1 className="page-title flex items-center gap-3 text-white">
            <span className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
              <Sparkles className="text-indigo-400" size={24} />
            </span>
            {language === 'bn' ? 'ফ্ল্যাশ-কার্ড রিভিশন (Flashcards)' : 'Flashcards Revision'}
          </h1>
          <p className="page-subtitle text-slate-400">
            {language === 'bn'
              ? 'স্পেসড রিপিটেশন (SRS) পদ্ধতিতে ইংরেজি শব্দের অর্থ ও উচ্চারণ রিভিশন করুন।'
              : 'Review English word meanings and pronunciations using the Spaced Repetition System (SRS).'}
          </p>
        </div>
      </div>

      {error && (
        <div className="glass-alert glass-alert-error mb-6 flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {currentCard ? (
        <div className="grid gap-6 md:grid-cols-[1fr_280px] max-w-4xl mx-auto">
          {/* Flip Card Area */}
          <div className="card-card flex flex-col justify-between items-center p-6 bg-slate-950/40 border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none" />

            {/* Progress bar */}
            <div className="w-full mb-4">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                <span>{language === 'bn' ? 'কার্ড নম্বর:' : 'Card:'} {selectedIndex + 1} / {cards.length}</span>
                {currentCard.difficulty_level && (
                  <span className="bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 rounded px-2.5 py-0.5 uppercase tracking-wider text-[10px]">
                    {currentCard.difficulty_level}
                  </span>
                )}
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${((selectedIndex) / cards.length) * 100}%` }}
                />
              </div>
            </div>

            {/* 3D Flip Card */}
            <div className="card-scene w-full" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`flip-card ${isFlipped ? 'is-flipped' : ''}`} style={{ height: '260px' }}>
                <div className="card-face card-face-front flex flex-col justify-center items-center relative">
                  <div className="text-[10px] text-indigo-400 mb-2 uppercase font-black tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                    English Word
                  </div>
                  <div className="text-4xl font-extrabold text-white tracking-wide mb-2">{currentCard.word}</div>
                  {currentCard.ipa && (
                    <div className="text-sm text-slate-400 font-mono bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                      [{currentCard.ipa}]
                    </div>
                  )}
                  <button
                    onClick={(e) => handlePlayAudio(currentCard, e)}
                    className={`mt-4 w-12 h-12 rounded-full border-none flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md ${
                      isSpeaking
                        ? 'bg-red-500 text-white animate-pulse scale-105 shadow-red-500/40'
                        : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                    title={language === 'bn' ? 'উচ্চারণ শুনুন' : 'Listen Pronunciation'}
                  >
                    <Volume2 size={20} />
                  </button>
                  <div className="text-[10px] text-cyan-400 mt-6 font-bold animate-pulse tracking-wide uppercase">
                    {language === 'bn' ? 'কার্ডটি উল্টাতে ক্লিক করুন 🔄' : 'Click to Flip Card 🔄'}
                  </div>
                </div>

                <div className="card-face card-face-back flex flex-col justify-center items-center">
                  <div className="text-[10px] text-cyan-400 mb-2 uppercase font-black tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                    Bangla Meaning
                  </div>
                  <div className="text-3xl font-extrabold text-white mb-2 leading-relaxed">
                    {currentCard.bangla_meaning || currentCard.definition}
                  </div>
                  {currentCard.syllables && (
                    <div className="text-xs text-slate-400 font-semibold mt-1">
                      {language === 'bn' ? 'সিলেবল' : 'Syllables'}: <span className="text-slate-300 font-bold">{currentCard.syllables}</span>
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 mt-8 font-bold tracking-wide uppercase">
                    {language === 'bn' ? 'সামনে ফিরে যেতে ক্লিক করুন 🔄' : 'Click to Flip Back 🔄'}
                  </div>
                </div>
              </div>
            </div>

            {/* Confidence buttons */}
            <div className="w-full mt-6 space-y-3 border-t border-white/5 pt-4">
              <div className="text-center text-xs text-slate-300 font-bold">
                {language === 'bn' ? 'এই শব্দটি কতটা মনে ছিল?' : 'How well did you remember this?'}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {CONFIDENCE_LEVELS.map((level) => (
                  <button
                    key={level.label}
                    onClick={() => handleReview(level)}
                    disabled={!!feedback}
                    className={`py-3 rounded-xl font-bold border transition cursor-pointer text-xs flex flex-col items-center gap-1 ${level.color} ${feedback ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                  >
                    <span className="text-lg">{level.emoji}</span>
                    <span>{language === 'bn' ? level.labelBn : level.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {feedback && (
              <div className="glass-alert glass-alert-success mt-4 w-full animate-bounce-in flex items-center justify-center gap-2 font-bold text-sm">
                <span>{feedback}</span>
              </div>
            )}
          </div>

          {/* Tutor Sidebar */}
          <div className="card-card flex flex-col items-center justify-center p-6 text-center border border-white/5 bg-slate-950/40 backdrop-blur-md shadow-xl relative overflow-hidden h-fit">
            <div className="absolute top-0 left-0 w-20 h-20 bg-indigo-500/5 rounded-full filter blur-lg pointer-events-none" />
            <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-indigo-500/30 shadow-md">
              <img src={tutorAvatar} alt="Tutor" className="w-full h-full object-cover" />
            </div>
            <div className="font-extrabold text-white text-base mb-0.5">{tutorName}</div>
            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-4">Your Tutor Guide</div>
            <p className="text-xs text-slate-300 leading-relaxed font-semibold italic bg-white/5 border border-white/5 p-3.5 rounded-2xl mb-4">
              {language === 'bn'
                ? '"প্রতিটি কার্ডের পর আপনার আত্মবিশ্বাসের স্তর বেছে নিন। এটি আপনার শেখার গতিকে স্মার্টভাবে নিয়ন্ত্রণ করবে!"'
                : '"Rate your confidence after each card. This helps the SRS schedule the perfect review timing for each word!"'}
            </p>

            {/* Session mini-progress */}
            <div className="w-full bg-white/3 border border-white/5 rounded-xl p-3 text-left">
              <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">{language === 'bn' ? 'এই সেশন' : 'This Session'}</div>
              {CONFIDENCE_LEVELS.slice().reverse().map(l => (
                <div key={l.label} className="flex justify-between items-center text-[10px] mb-1">
                  <span className="text-slate-400">{l.emoji} {language === 'bn' ? l.labelBn : l.label}</span>
                  <span className="font-bold text-white">{sessionData.byConfidence[l.score] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state max-w-md mx-auto py-16 border border-dashed border-white/10 bg-slate-950/20">
          <div className="text-5xl mb-4 animate-bounce">🎉</div>
          <h3 className="font-extrabold text-white text-base">{language === 'bn' ? 'রিভিশন করার মতো শব্দ নেই' : 'No words to review'}</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
            {language === 'bn'
              ? 'চমৎকার! সব ফ্ল্যাশ-কার্ড পড়া শেষ। নতুন চ্যাপ্টার ও লেসন সম্পন্ন করে আরও শব্দ যোগ করুন।'
              : 'Excellent! You have reviewed all flashcards. Complete new chapters and lessons to add more words.'}
          </p>
        </div>
      )}
    </div>
  );
}

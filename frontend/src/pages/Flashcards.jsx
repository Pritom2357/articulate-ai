import { useEffect, useState } from 'react';
import { getDueFlashcards, reviewFlashcard } from '../api/progress.js';
import useAuth from '../hooks/useAuth.js';
import { Award, Volume2, Sparkles, ShieldAlert } from 'lucide-react';
import { playWordAudio } from '../utils/playWordAudio.js';

// Import tutor assets for decoration/encouragement
import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articucate_female.jpeg';

export default function Flashcards() {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const activeTutor = user?.guide_preference || 'MALE';
  const tutorAvatar = activeTutor === 'FEMALE' ? femaleAvatar : maleAvatar;
  const tutorName = activeTutor === 'FEMALE' ? 'Riya (রিয়া)' : 'Rohit (রোহিত)';

  useEffect(() => {
    async function loadCards() {
      try {
        const dueCards = await getDueFlashcards();
        setCards(dueCards || []);
      } catch (err) {
        setError(err.payload?.error || err.message || 'ফ্ল্যাশ-কার্ড লোড করা যায়নি।');
      }
    }

    loadCards();
  }, []);

  const handlePlayAudio = async (card, e) => {
    if (e) e.stopPropagation();
    await playWordAudio(
      card,
      activeTutor,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false)
    );
  };

  async function handleReview(score) {
    const card = cards[selectedIndex];
    if (!card) return;

    try {
      setError('');
      setFeedback('');
      await reviewFlashcard({ wordId: card.word_id || card.id, score });
      
      let message = 'রিভিউ সেভ হয়েছে!';
      if (score >= 90) message = `${tutorName}: "অসাধারণ! এটি আপনার চমৎকার মনে আছে।"`;
      else if (score >= 70) message = `${tutorName}: "খুব ভালো! নিয়মিত অনুশীলনে রাখুন।"`;
      else message = `${tutorName}: "কোনো ব্যাপার না, আমরা শীঘ্রই আবার এটি রিভিশন করব।"`;
      
      setFeedback(message);
      setIsFlipped(false);

      setTimeout(() => {
        const nextIndex = selectedIndex + 1;
        setSelectedIndex(nextIndex < cards.length ? nextIndex : 0);
        setFeedback('');
      }, 1500);

    } catch (err) {
      setError(err.payload?.error || err.message || 'রিভিউ সংরক্ষণ ব্যর্থ হয়েছে।');
    }
  }

  const currentCard = cards[selectedIndex];

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header border-b border-white/10 pb-4 mb-6">
        <div>
          <h1 className="page-title flex items-center gap-3 text-white">
            <span className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
              <Sparkles className="text-indigo-400" size={24} />
            </span>
            ফ্ল্যাশ-কার্ড রিভিশন (Flashcards)
          </h1>
          <p className="page-subtitle text-slate-400">
            স্পেসড রিপিটেশন (SRS) পদ্ধতিতে ইংরেজি শব্দের অর্থ ও উচ্চারণ রিভিশন করুন।
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none"></div>

            <div className="w-full flex justify-between items-center mb-4 text-xs font-bold text-slate-400">
              <span className="bg-white/5 border border-white/5 rounded px-2.5 py-1">
                কার্ড নম্বর: {selectedIndex + 1} / {cards.length}
              </span>
              {currentCard.difficulty_level && (
                <span className="bg-indigo-500/15 border border-indigo-500/20 text-indigo-300 rounded px-2.5 py-1 uppercase tracking-wider text-[10px]">
                  {currentCard.difficulty_level}
                </span>
              )}
            </div>

            {/* 3D Scene */}
            <div className="card-scene w-full" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`flip-card ${isFlipped ? 'is-flipped' : ''}`} style={{ height: '260px' }}>
                
                {/* Front Side: English Word */}
                <div className="card-face card-face-front flex flex-col justify-center items-center relative">
                  <div className="text-[10px] text-indigo-400 mb-2 uppercase font-black tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                    English Word
                  </div>
                  
                  <div className="text-4xl font-extrabold text-white tracking-wide mb-2">
                    {currentCard.word}
                  </div>

                  {currentCard.ipa && (
                    <div className="text-sm text-slate-400 font-mono bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                      [{currentCard.ipa}]
                    </div>
                  )}

                  {/* Tutor Pronunciation Speaker button */}
                  <button
                    onClick={(e) => handlePlayAudio(currentCard, e)}
                    className={`mt-4 w-12 h-12 rounded-full border-none flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md ${
                      isSpeaking
                        ? 'bg-red-500 text-white animate-pulse scale-105 shadow-red-500/40'
                        : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                    title="উচ্চারণ শুনুন"
                  >
                    <Volume2 size={20} />
                  </button>

                  <div className="text-[10px] text-cyan-400 mt-6 font-bold animate-pulse tracking-wide uppercase">
                    কার্ডটি উল্টাতে ক্লিক করুন 🔄
                  </div>
                </div>

                {/* Back Side: Bangla Meaning */}
                <div className="card-face card-face-back flex flex-col justify-center items-center">
                  <div className="text-[10px] text-cyan-400 mb-2 uppercase font-black tracking-widest bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                    Bangla Meaning
                  </div>

                  <div className="text-3xl font-extrabold text-white mb-2 leading-relaxed">
                    {currentCard.bangla_meaning || currentCard.definition}
                  </div>

                  {currentCard.syllables && (
                    <div className="text-xs text-slate-400 font-semibold mt-1">
                      সিলেবল (Syllables): <span className="text-slate-300 font-bold">{currentCard.syllables}</span>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-400 mt-8 font-bold tracking-wide uppercase">
                    সামনে ফিরে যেতে ক্লিক করুন 🔄
                  </div>
                </div>

              </div>
            </div>

            {/* SRS Review Actions */}
            <div className="w-full mt-6 space-y-4 border-t border-white/5 pt-4">
              <div className="text-center text-xs text-slate-300 font-bold">
                আপনার শব্দটির অর্থ কতটুকু মনে আছে?
              </div>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  className="px-5 py-3 rounded-xl font-bold bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/25 transition cursor-pointer text-xs flex-1 min-w-[100px] text-center"
                  onClick={() => handleReview(90)}
                  disabled={feedback}
                >
                  সহজ (Easy)
                </button>
                <button
                  className="px-5 py-3 rounded-xl font-bold bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/25 transition cursor-pointer text-xs flex-1 min-w-[100px] text-center"
                  onClick={() => handleReview(70)}
                  disabled={feedback}
                >
                  ঠিক আছে (Good)
                </button>
                <button
                  className="px-5 py-3 rounded-xl font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 transition cursor-pointer text-xs flex-1 min-w-[100px] text-center"
                  onClick={() => handleReview(50)}
                  disabled={feedback}
                >
                  কঠিন (Hard)
                </button>
              </div>
            </div>

            {feedback && (
              <div className="glass-alert glass-alert-success mt-4 w-full animate-bounce-in flex items-center justify-center gap-2 font-bold text-xs">
                <span>{feedback}</span>
              </div>
            )}
          </div>

          {/* Active Tutor Encouragement Sidebar */}
          <div className="card-card flex flex-col items-center justify-center p-6 text-center border border-white/5 bg-slate-950/40 backdrop-blur-md shadow-xl relative overflow-hidden h-fit">
            <div className="absolute top-0 left-0 w-20 h-20 bg-indigo-500/5 rounded-full filter blur-lg pointer-events-none"></div>

            <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-indigo-500/30 shadow-md">
              <img src={tutorAvatar} alt="Tutor" className="w-full h-full object-cover" />
            </div>
            <div className="font-extrabold text-white text-base mb-0.5">{tutorName}</div>
            <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-4">Your Tutor Guide</div>
            
            <p className="text-xs text-slate-300 leading-relaxed font-semibold italic bg-white/5 border border-white/5 p-3.5 rounded-2xl">
              "আমি আপনাকে এই শব্দগুলো সহজে মনে রাখতে সাহায্য করব। প্রতিদিন এভাবে কার্ডগুলো রিভিশন করুন, আপনার ইংরেজি ভোকাবুলারি চমৎকার উন্নত হবে!"
            </p>
          </div>
        </div>
      ) : (
        <div className="empty-state max-w-md mx-auto py-16 border border-dashed border-white/10 bg-slate-950/20">
          <div className="text-5xl mb-4 animate-bounce">🎉</div>
          <h3 className="font-extrabold text-white text-base">রিভিশন করার মতো শব্দ নেই</h3>
          <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
            চমৎকার! সব ফ্ল্যাশ-কার্ড পড়া শেষ। নতুন চ্যাপ্টার ও লেসন সম্পন্ন করে আরও শব্দ যোগ করুন।
          </p>
        </div>
      )}
    </div>
  );
}

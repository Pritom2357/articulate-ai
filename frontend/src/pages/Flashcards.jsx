import { useEffect, useState } from 'react';
import { getDueFlashcards, reviewFlashcard } from '../api/progress.js';
import useAuth from '../hooks/useAuth.js';

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

  const activeTutor = user?.guide_preference || 'MALE';
  const tutorAvatar = activeTutor === 'FEMALE' ? femaleAvatar : maleAvatar;
  const tutorName = activeTutor === 'FEMALE' ? 'Riya (রিয়া)' : 'Rohit (রোহিত)';

  useEffect(() => {
    async function loadCards() {
      try {
        const dueCards = await getDueFlashcards();
        setCards(dueCards || []);
      } catch (err) {
        setError(err.payload?.error || err.message || 'Unable to load flashcards');
      }
    }

    loadCards();
  }, []);

  async function handleReview(score) {
    const card = cards[selectedIndex];
    if (!card) return;

    try {
      setError('');
      setFeedback('');
      await reviewFlashcard({ wordId: card.word_id || card.id, score });
      
      let message = 'সরাসরি রিভিউ সেভ হয়েছে!';
      if (score >= 90) message = `${tutorName}: "অসাধারণ! এটি আপনার বেশ ভালো মনে আছে।"`;
      else if (score >= 70) message = `${tutorName}: "খুব ভালো! নিয়মিত চর্চায় রাখুন।"`;
      else message = `${tutorName}: "কোনো ব্যাপার না, শীঘ্রই আবার এটি রিভিশন করব।"`;
      
      setFeedback(message);
      setIsFlipped(false);

      setTimeout(() => {
        const nextIndex = selectedIndex + 1;
        setSelectedIndex(nextIndex < cards.length ? nextIndex : 0);
        setFeedback('');
      }, 1500);

    } catch (err) {
      setError(err.payload?.error || err.message || 'Review failed');
    }
  }

  const currentCard = cards[selectedIndex];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Flashcards (ফ্ল্যাশ-কার্ড)</h1>
          <p className="page-subtitle">স্মৃতিশক্তি বাড়াতে স্পেসড রিপিটেশন পদ্ধতিতে শব্দের অর্থ রিভিশন করুন।</p>
        </div>
      </div>

      {error && <div className="glass-alert glass-alert-error mb-4">{error}</div>}
      
      {currentCard ? (
        <div className="grid gap-6 md:grid-cols-[1fr_260px] max-w-4xl mx-auto">
          {/* Flip Card Area */}
          <div className="card-card flex flex-col justify-between items-center p-6 bg-slate-900/10 backdrop-blur-md border border-slate-200/50">
            <div className="w-full text-center mb-2 text-xs text-indigo-400 uppercase tracking-widest font-bold">
              Card {selectedIndex + 1} of {cards.length}
            </div>

            {/* 3D Scene */}
            <div className="card-scene" onClick={() => setIsFlipped(!isFlipped)}>
              <div className={`flip-card ${isFlipped ? 'is-flipped' : ''}`}>
                
                {/* Front Side: English Word */}
                <div className="card-face card-face-front">
                  <div className="text-sm text-indigo-400 mb-2 uppercase font-extrabold tracking-widest">English Word</div>
                  <div className="text-4xl font-extrabold text-white tracking-wide">
                    {currentCard.word}
                  </div>
                  {currentCard.ipa && (
                    <div className="text-sm text-slate-400 mt-2 font-mono">[{currentCard.ipa}]</div>
                  )}
                  {currentCard.syllables && (
                    <div className="text-xs text-slate-500 mt-1 font-semibold">Syllables: {currentCard.syllables}</div>
                  )}
                  <div className="text-xs text-cyan-400 mt-6 font-semibold animate-pulse">
                    ক্লিক করে অর্থ দেখুন 🔄
                  </div>
                </div>

                {/* Back Side: Bangla Meaning */}
                <div className="card-face card-face-back">
                  <div className="text-sm text-cyan-400 mb-2 uppercase font-extrabold tracking-widest">Bangla Meaning</div>
                  <div className="text-3xl font-extrabold text-white">
                    {currentCard.bangla_meaning || currentCard.definition}
                  </div>
                  {currentCard.difficulty_level && (
                    <span className="mt-4 px-2 py-1 text-xs rounded bg-indigo-500/20 text-indigo-300 font-semibold uppercase">
                      {currentCard.difficulty_level}
                    </span>
                  )}
                  <div className="text-xs text-slate-400 mt-6 font-semibold">
                    কার্ড ফ্লিপ করতে পুনরায় ক্লিক করুন 🔄
                  </div>
                </div>

              </div>
            </div>

            {/* SRS Review Actions */}
            <div className="w-full mt-4 space-y-4">
              <div className="text-center text-xs text-slate-500 font-semibold">
                আপনার শব্দটির অর্থ মনে আছে কি? নিচের বাটনে চাপুন:
              </div>
              <div className="flex justify-center gap-4">
                <button
                  className="px-6 py-3 rounded-xl font-bold bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30 transition cursor-pointer"
                  onClick={() => handleReview(90)}
                  disabled={feedback}
                >
                  🟢 Easy (খুব সহজ)
                </button>
                <button
                  className="px-6 py-3 rounded-xl font-bold bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 transition cursor-pointer"
                  onClick={() => handleReview(70)}
                  disabled={feedback}
                >
                  🔵 Good (ঠিক আছে)
                </button>
                <button
                  className="px-6 py-3 rounded-xl font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition cursor-pointer"
                  onClick={() => handleReview(50)}
                  disabled={feedback}
                >
                  🔴 Hard (কঠিন লেগেছে)
                </button>
              </div>
            </div>

            {feedback && (
              <div className="glass-alert glass-alert-success mt-4 w-full animate-bounce-in">
                <span>{feedback}</span>
              </div>
            )}
          </div>

          {/* Active Tutor Encouragement Sidebar */}
          <div className="card-card flex flex-col items-center justify-center p-6 text-center border border-slate-200/50 bg-slate-50">
            <div className="w-20 h-20 rounded-full overflow-hidden mb-3 border-2 border-indigo-500/30">
              <img src={tutorAvatar} alt="Tutor" className="w-full h-full object-cover" />
            </div>
            <div className="font-bold text-slate-800 text-sm mb-1">{tutorName}</div>
            <div className="text-xs text-indigo-600 font-semibold mb-4">Your Active Guide</div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              "আমি আপনাকে এই শব্দগুলো সহজে মনে রাখতে সাহায্য করব। প্রতিদিন চর্চা করুন, আপনার ইংরেজি জড়তা কেটে যাবেই!"
            </p>
          </div>
        </div>
      ) : (
        <div className="empty-state max-w-md mx-auto">
          <div className="text-4xl mb-2">🎉</div>
          <div>কোনো শব্দ রিভিশন করার নেই। সব কমপ্লিট! পরবর্তীতে আবার ঘুরে আসুন।</div>
        </div>
      )}
    </div>
  );
}

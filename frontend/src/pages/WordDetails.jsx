import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getWord } from '../api/curriculum.js';
import { getBookmarks, addBookmark, removeBookmark } from '../api/vocabulary.js';
import { Bookmark, Volume2, ChevronLeft } from 'lucide-react';
import useAuth from '../hooks/useAuth.js';
import { speakText } from '../utils/tts.js';

export default function WordDetails() {
    const { user } = useAuth();
    const activeTutor = user?.guide_preference || 'MALE';

    const { id } = useParams();
    const [word, setWord] = useState(null);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);

    useEffect(() => {
        async function loadWordAndBookmarkStatus() {
            try {
                setError('');
                const wordResult = await getWord(id);
                setWord(wordResult);

                // Check bookmark status
                const bookmarks = await getBookmarks();
                const bookmarked = bookmarks.some(b => b.word_id === parseInt(id));
                setIsBookmarked(bookmarked);
            } catch (err) {
                setError(err.payload?.error || err.message || 'Unable to load word details');
            }
        }

        loadWordAndBookmarkStatus();
    }, [id]);

    const playTTS = (text) => {
        if ('speechSynthesis' in window) {
            speakText(
                text,
                activeTutor,
                () => setIsSpeaking(true),
                () => setIsSpeaking(false)
            );
        } else {
            alert('Your browser does not support text-to-speech.');
        }
    };

    const handleToggleBookmark = async () => {
        if (!word) return;
        setBookmarkLoading(true);
        try {
            if (isBookmarked) {
                await removeBookmark(word.id);
                setIsBookmarked(false);
            } else {
                await addBookmark(word.id);
                setIsBookmarked(true);
            }
        } catch (err) {
            setError(err.payload?.error || err.message || 'Failed to update bookmark status');
        } finally {
            setBookmarkLoading(false);
        }
    };

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header border-b border-white/10 pb-4 mb-6">
                <div>
                    <h1 className="page-title flex items-center gap-3">
                        <span className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
                            <Bookmark className="text-indigo-400" size={24} />
                        </span>
                        Word details
                    </h1>
                    <p className="page-subtitle">Review vocabulary details and pronunciations.</p>
                </div>
            </div>

            {error && <div className="glass-alert glass-alert-error mb-6">{error}</div>}

            {word ? (
                <div className="grid gap-6 lg:grid-cols-[2fr_1fr] max-w-4xl mx-auto">
                    <div className="card-card space-y-5 bg-slate-950/40 border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none"></div>

                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h2 className="text-3xl font-extrabold text-white tracking-wide">{word.word || `Word ${id}`}</h2>
                                <p className="text-lg text-indigo-300 font-semibold mt-1">অর্থ: {word.bangla_meaning || 'N/A'}</p>
                            </div>
                            
                            <button
                                onClick={handleToggleBookmark}
                                disabled={bookmarkLoading}
                                className={`w-12 h-12 rounded-xl border flex items-center justify-center cursor-pointer transition ${
                                    isBookmarked
                                        ? 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                                        : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
                                }`}
                                title={isBookmarked ? "Remove bookmark" : "Add bookmark"}
                            >
                                <Bookmark size={20} className={isBookmarked ? 'fill-cyan-400' : ''} />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-4 my-2 text-sm">
                            <div>
                                <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Phonetic</span>
                                <span className="text-white font-mono mt-1 block">{word.ipa || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Syllables</span>
                                <span className="text-white font-bold mt-1 block">{word.syllables || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Difficulty</span>
                                <span className="text-white font-bold mt-1 block uppercase">{word.difficulty_level || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider">Frequency rank</span>
                                <span className="text-white font-bold mt-1 block">{word.frequency_rank ?? 'N/A'}</span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <span className="text-xs text-slate-400 font-bold block uppercase tracking-wider mb-2">Pronunciation</span>
                            <div className="flex gap-4 items-center">
                                <button
                                    onClick={() => playTTS(word.word)}
                                    className={`w-12 h-12 rounded-full border-none flex items-center justify-center cursor-pointer transition-all duration-300 shadow-md ${
                                        isSpeaking
                                            ? 'bg-red-500 text-white animate-pulse scale-105'
                                            : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                    }`}
                                    title="Listen pronunciation"
                                >
                                    <Volume2 size={20} />
                                </button>
                                <span className="text-xs text-slate-400 font-semibold">
                                    {isSpeaking ? 'Now playing pronunciation...' : 'Click to play pronunciation audio'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="card-card bg-slate-950/40 border border-white/10 flex flex-col justify-between h-fit gap-4">
                        <div>
                            <h3 className="card-title text-white">Actions</h3>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                Review this vocabulary word, test your pronunciation, or practice with flashcards.
                            </p>
                        </div>
                        <Link to="/curriculum" className="secondary-button text-center w-full flex items-center justify-center gap-1">
                            <ChevronLeft size={16} /> Back to curriculum
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="empty-state">Loading word details…</div>
            )}
        </div>
    );
}

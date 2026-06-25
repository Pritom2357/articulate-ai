import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserVocabulary, getBookmarks, addBookmark, removeBookmark } from '../api/vocabulary.js';
import { Bookmark, Volume2, Search, Sparkles, ShieldAlert, Award, Eye } from 'lucide-react';
import useAuth from '../hooks/useAuth.js';
import { playWordAudio } from '../utils/playWordAudio.js';

export default function Vocabulary() {
  const { user } = useAuth();
  const activeTutor = user?.guide_preference || 'MALE';

  const [activeTab, setActiveTab] = useState('vocabulary'); // 'vocabulary' | 'bookmarks'
  const [vocabFilter, setVocabFilter] = useState('all'); // 'all', 'new', 'learning', 'familiar', 'mastered'
  const [vocabulary, setVocabulary] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [speakingWordId, setSpeakingWordId] = useState(null);

  const fetchVocabularyData = async () => {
    try {
      setLoading(true);
      setError('');
      const [vocabData, bookmarkData] = await Promise.all([
        getUserVocabulary(vocabFilter),
        getBookmarks(),
      ]);
      setVocabulary(vocabData || []);
      setBookmarks(bookmarkData || []);
    } catch (err) {
      setError(err.payload?.error || err.message || 'ভোকাবুলারি লোড করতে সমস্যা হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVocabularyData();
  }, [vocabFilter]);

  const handlePlayAudio = async (item) => {
    const wordId = item.word_id ?? item.id;
    await playWordAudio(
      item,
      activeTutor,
      () => setSpeakingWordId(wordId),
      () => setSpeakingWordId(null)
    );
  };

  const handleToggleBookmark = async (wordId, currentIsBookmarked) => {
    try {
      if (currentIsBookmarked) {
        await removeBookmark(wordId);
        // Optimistic UI updates
        setBookmarks(prev => prev.filter(b => b.word_id !== wordId));
        setVocabulary(prev => prev.map(w => w.word_id === wordId ? { ...w, is_bookmarked: false } : w));
      } else {
        await addBookmark(wordId);
        // Find word in vocabulary list to add to bookmarks
        const wordObj = vocabulary.find(w => w.word_id === wordId);
        if (wordObj) {
          setBookmarks(prev => [
            {
              word_id: wordObj.word_id,
              word: wordObj.word,
              bangla_meaning: wordObj.bangla_meaning,
              ipa: wordObj.ipa,
              syllables: wordObj.syllables,
              difficulty_level: wordObj.difficulty_level,
              familiarity: wordObj.familiarity,
              correct_count: wordObj.correct_count,
              wrong_count: wordObj.wrong_count,
            },
            ...prev,
          ]);
        } else {
          // If not in vocabulary (highly unlikely, but safe fallback), refetch bookmarks
          const bookmarkData = await getBookmarks();
          setBookmarks(bookmarkData || []);
        }
        setVocabulary(prev => prev.map(w => w.word_id === wordId ? { ...w, is_bookmarked: true } : w));
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      setError('বুকমার্ক পরিবর্তন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  // Filter lists based on search term
  const filteredVocabulary = vocabulary.filter(w =>
    w.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (w.bangla_meaning && w.bangla_meaning.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredBookmarks = bookmarks.filter(b =>
    b.word.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.bangla_meaning && b.bangla_meaning.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getFamiliarityBadge = (familiarity) => {
    switch (familiarity) {
      case 'MASTERED':
        return <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">MASTERED</span>;
      case 'FAMILIAR':
        return <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">FAMILIAR</span>;
      case 'LEARNING':
        return <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">LEARNING</span>;
      default:
        return <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-slate-500/10 border border-slate-500/20 text-slate-400">NEW</span>;
    }
  };

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header border-b border-white/10 pb-4 mb-6">
        <div>
          <h1 className="page-title flex items-center gap-3 text-white">
            <span className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
              <Bookmark className="text-indigo-400" size={24} />
            </span>
            আমার শব্দভান্ডার (Vocabulary & Bookmarks)
          </h1>
          <p className="page-subtitle text-slate-400">
            আপনার শিখে যাওয়া ইংরেজি শব্দগুলোর পরিচিতি মাত্রা এবং আপনার বুকমার্ক করা গুরুত্বপূর্ণ শব্দসমূহ একনজরে দেখুন।
          </p>
        </div>
      </div>

      {error && (
        <div className="glass-alert glass-alert-error mb-6 flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-6 gap-2">
        <button
          onClick={() => {
            setActiveTab('vocabulary');
            setSearchTerm('');
          }}
          className={`px-5 py-3 font-bold text-sm border-b-2 cursor-pointer transition-all ${
            activeTab === 'vocabulary'
              ? 'border-indigo-500 text-white bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          📚 আমার শব্দভান্ডার ({vocabulary.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('bookmarks');
            setSearchTerm('');
          }}
          className={`px-5 py-3 font-bold text-sm border-b-2 cursor-pointer transition-all ${
            activeTab === 'bookmarks'
              ? 'border-indigo-500 text-white bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          ⭐ বুকমার্ক করা শব্দ ({bookmarks.length})
        </button>
      </div>

      {/* Toolbar: Filters (if vocab tab) & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {activeTab === 'vocabulary' && (
          <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-slate-900/40 border border-white/5">
            {[
              { id: 'all', label: 'সব শব্দ (All)' },
              { id: 'new', label: 'নতুন (New)' },
              { id: 'learning', label: 'শিখছি (Learning)' },
              { id: 'familiar', label: 'পরিচিত (Familiar)' },
              { id: 'mastered', label: 'আয়ত্ত (Mastered)' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setVocabFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  vocabFilter === f.id
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        <div className="relative flex-grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder={activeTab === 'vocabulary' ? 'শব্দভান্ডার খুঁজুন...' : 'বুকমার্ক করা শব্দ খুঁজুন...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input pl-10 py-2.5 rounded-xl text-sm w-full"
          />
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <div className="text-slate-400 font-semibold">ভোকাবুলারি ডাটা লোড হচ্ছে...</div>
        </div>
      ) : activeTab === 'vocabulary' ? (
        filteredVocabulary.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredVocabulary.map(item => {
              const isBookmarked = item.is_bookmarked;
              return (
                <div key={item.word_id} className="card-card p-5 bg-slate-950/40 border border-white/10 hover:border-indigo-500/30 hover:scale-[1.01] hover:shadow-[0_12px_24px_rgba(99,102,241,0.03)] transition-all duration-300 relative flex flex-col justify-between group overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/3 rounded-full filter blur-xl pointer-events-none"></div>
                  
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      {getFamiliarityBadge(item.familiarity)}
                      <button
                        onClick={() => handleToggleBookmark(item.word_id, isBookmarked)}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                          isBookmarked
                            ? 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
                            : 'bg-white/5 border-white/5 text-slate-500 hover:text-slate-300'
                        }`}
                        title={isBookmarked ? "সংরক্ষণ তালিকা থেকে বাদ দিন" : "সংরক্ষণ করুন"}
                      >
                        <Bookmark size={14} className={isBookmarked ? 'fill-cyan-400' : ''} />
                      </button>
                    </div>

                    <h2 className="text-xl font-extrabold text-white tracking-wide group-hover:text-indigo-400 transition-colors">
                      {item.word}
                    </h2>
                    {item.ipa && <p className="text-xs text-slate-500 font-mono mt-0.5">[{item.ipa}]</p>}
                    <p className="text-sm text-slate-300 mt-2 font-medium">অর্থ: {item.bangla_meaning}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                      <span>সফলতা:</span>
                      <span className="text-emerald-400 font-bold">{item.correct_count} বার</span>
                      <span className="text-slate-500">|</span>
                      <span>ব্যর্থতা:</span>
                      <span className="text-rose-400 font-bold">{item.wrong_count} বার</span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handlePlayAudio(item)}
                        className={`w-8 h-8 rounded-lg border-none flex items-center justify-center cursor-pointer transition ${
                          speakingWordId === item.word_id
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400'
                        }`}
                        title="উচ্চারণ শুনুন"
                      >
                        <Volume2 size={14} />
                      </button>
                      <Link
                        to={`/words/${item.word_id}`}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
                        title="বিস্তারিত দেখুন"
                      >
                        <Eye size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state py-16 border border-dashed border-white/10 bg-slate-950/20 max-w-lg mx-auto">
            <div className="text-5xl mb-4 animate-bounce">📚</div>
            <h3 className="font-extrabold text-white text-base">কোনো শব্দ পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
              {searchTerm ? 'অনুগ্রহ করে সার্চ কিওয়ার্ড পরিবর্তন করে দেখুন।' : 'আপনার কারিকুলাম সম্পন্ন করে এই ফিল্টারের অধীনে শব্দ যোগ করুন।'}
            </p>
          </div>
        )
      ) : (
        filteredBookmarks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBookmarks.map(item => {
              return (
                <div key={item.word_id} className="card-card p-5 bg-slate-950/40 border border-white/10 hover:border-indigo-500/30 hover:scale-[1.01] hover:shadow-[0_12px_24px_rgba(99,102,241,0.03)] transition-all duration-300 relative flex flex-col justify-between group overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/3 rounded-full filter blur-xl pointer-events-none"></div>

                  <div>
                    <div className="flex justify-between items-start mb-3">
                      {getFamiliarityBadge(item.familiarity)}
                      <button
                        onClick={() => handleToggleBookmark(item.word_id, true)}
                        className="w-8 h-8 rounded-lg border bg-cyan-500/10 border-cyan-500/20 text-cyan-400 flex items-center justify-center cursor-pointer hover:bg-cyan-500/20 transition-colors"
                        title="সংরক্ষণ তালিকা থেকে বাদ দিন"
                      >
                        <Bookmark size={14} className="fill-cyan-400" />
                      </button>
                    </div>

                    <h2 className="text-xl font-extrabold text-white tracking-wide group-hover:text-indigo-400 transition-colors">
                      {item.word}
                    </h2>
                    {item.ipa && <p className="text-xs text-slate-500 font-mono mt-0.5">[{item.ipa}]</p>}
                    <p className="text-sm text-slate-300 mt-2 font-medium">অর্থ: {item.bangla_meaning}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                      <span>সফলতা:</span>
                      <span className="text-emerald-400 font-bold">{item.correct_count} বার</span>
                      <span className="text-slate-500">|</span>
                      <span>ব্যর্থতা:</span>
                      <span className="text-rose-400 font-bold">{item.wrong_count} বার</span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handlePlayAudio(item)}
                        className={`w-8 h-8 rounded-lg border-none flex items-center justify-center cursor-pointer transition ${
                          speakingWordId === item.word_id
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400'
                        }`}
                        title="উচ্চারণ শুনুন"
                      >
                        <Volume2 size={14} />
                      </button>
                      <Link
                        to={`/words/${item.word_id}`}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
                        title="বিস্তারিত দেখুন"
                      >
                        <Eye size={14} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state py-16 border border-dashed border-white/10 bg-slate-950/20 max-w-lg mx-auto">
            <div className="text-5xl mb-4 animate-bounce">⭐</div>
            <h3 className="font-extrabold text-white text-base">কোনো বুকমার্ক পাওয়া যায়নি</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
              {searchTerm ? 'অনুগ্রহ করে সার্চ কিওয়ার্ড পরিবর্তন করে দেখুন।' : 'লেসন বা ড্যাশবোর্ড থেকে ইংরেজি শব্দ বুকমার্ক করে রাখুন।'}
            </p>
          </div>
        )
      )}
    </div>
  );
}

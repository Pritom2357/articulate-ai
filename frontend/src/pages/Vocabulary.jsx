import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getUserVocabulary, getBookmarks, addBookmark, removeBookmark } from '../api/vocabulary.js';
import { Bookmark, Volume2, Search, ShieldAlert, Eye, RefreshCw, BookOpen, Star, BookMarked } from 'lucide-react';
import useAuth from '../hooks/useAuth.js';
import { playWordAudio } from '../utils/playWordAudio.js';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';

const CACHE_TTL_MS = 5 * 60 * 1000;

function readVocabCache(userId, filter) {
  try {
    const raw = localStorage.getItem(`articulate_vocab_${userId}_${filter}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch { return null; }
}

function writeVocabCache(userId, filter, vocabulary) {
  try {
    localStorage.setItem(`articulate_vocab_${userId}_${filter}`, JSON.stringify({ vocabulary, cachedAt: Date.now() }));
  } catch { /* quota exceeded */ }
}

function readBookmarksCache(userId) {
  try {
    const raw = localStorage.getItem(`articulate_bookmarks_${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch { return null; }
}

function writeBookmarksCache(userId, bookmarks) {
  try {
    localStorage.setItem(`articulate_bookmarks_${userId}`, JSON.stringify({ bookmarks, cachedAt: Date.now() }));
  } catch { /* quota exceeded */ }
}

function clearAllVocabCache(userId) {
  try {
    const prefix = `articulate_vocab_${userId}_`;
    Object.keys(localStorage).filter(k => k.startsWith(prefix)).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem(`articulate_bookmarks_${userId}`);
  } catch { /* ignore */ }
}

export default function Vocabulary() {
  const { user } = useAuth();
  const { language } = useThemeLanguage();
  const activeTutor = user?.guide_preference || 'MALE';

  const [activeTab, setActiveTab] = useState('vocabulary');
  const [vocabFilter, setVocabFilter] = useState('all');
  const [vocabulary, setVocabulary] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [speakingWordId, setSpeakingWordId] = useState(null);

  const fetchVocabularyData = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return;

    if (!forceRefresh) {
      const cachedVocab = readVocabCache(user.id, vocabFilter);
      const cachedBookmarks = readBookmarksCache(user.id);
      if (cachedVocab && cachedBookmarks) {
        setVocabulary(cachedVocab.vocabulary);
        setBookmarks(cachedBookmarks.bookmarks);
        setLoading(false);
        fetchVocabularyData(true).catch(() => {});
        return;
      }
    }

    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');
      const [vocabData, bookmarkData] = await Promise.all([
        getUserVocabulary(vocabFilter),
        getBookmarks(),
      ]);
      setVocabulary(vocabData || []);
      setBookmarks(bookmarkData || []);
      writeVocabCache(user.id, vocabFilter, vocabData || []);
      writeBookmarksCache(user.id, bookmarkData || []);
    } catch (err) {
      setError(err.payload?.error || err.message || (language === 'bn' ? 'ভোকাবুলারি লোড করতে সমস্যা হয়েছে।' : 'Failed to load vocabulary.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, vocabFilter]);

  useEffect(() => { fetchVocabularyData(); }, [fetchVocabularyData]);

  const handleRefresh = () => {
    clearAllVocabCache(user?.id);
    fetchVocabularyData(true);
  };

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
        const updatedBookmarks = bookmarks.filter(b => b.word_id !== wordId);
        setBookmarks(updatedBookmarks);
        setVocabulary(prev => prev.map(w => w.word_id === wordId ? { ...w, is_bookmarked: false } : w));
        writeBookmarksCache(user?.id, updatedBookmarks);
      } else {
        await addBookmark(wordId);
        const wordObj = vocabulary.find(w => w.word_id === wordId);
        let updatedBookmarks;
        if (wordObj) {
          updatedBookmarks = [
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
            ...bookmarks,
          ];
        } else {
          const bookmarkData = await getBookmarks();
          updatedBookmarks = bookmarkData || [];
        }
        setBookmarks(updatedBookmarks);
        setVocabulary(prev => prev.map(w => w.word_id === wordId ? { ...w, is_bookmarked: true } : w));
        writeBookmarksCache(user?.id, updatedBookmarks);
      }
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      setError(language === 'bn' ? 'বুকমার্ক পরিবর্তন করা যায়নি।' : 'Failed to modify bookmark. Please try again.');
    }
  };

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
              <BookMarked className="text-indigo-400" size={24} />
            </span>
            {language === 'bn' ? 'আমার শব্দভান্ডার' : 'My Vocabulary & Bookmarks'}
          </h1>
          <p className="page-subtitle text-slate-400">
            {language === 'bn'
              ? 'আপনার শিখে যাওয়া ইংরেজি শব্দগুলোর পরিচিতি মাত্রা এবং আপনার বুকমার্ক করা গুরুত্বপূর্ণ শব্দসমূহ একনজরে দেখুন।'
              : 'View the familiarity level of your learned English words and your bookmarked words at a glance.'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh vocabulary"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/8 text-xs font-semibold transition-colors disabled:opacity-50 shrink-0 self-start mt-1">
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
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
          onClick={() => { setActiveTab('vocabulary'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 cursor-pointer transition-all ${
            activeTab === 'vocabulary'
              ? 'border-indigo-500 text-white bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          <BookOpen size={15} />
          {language === 'bn' ? `আমার শব্দভান্ডার (${vocabulary.length})` : `My Vocabulary (${vocabulary.length})`}
        </button>
        <button
          onClick={() => { setActiveTab('bookmarks'); setSearchTerm(''); }}
          className={`flex items-center gap-2 px-5 py-3 font-bold text-sm border-b-2 cursor-pointer transition-all ${
            activeTab === 'bookmarks'
              ? 'border-indigo-500 text-white bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-white bg-transparent'
          }`}
        >
          <Star size={15} />
          {language === 'bn' ? `বুকমার্ক করা শব্দ (${bookmarks.length})` : `Bookmarks (${bookmarks.length})`}
        </button>
      </div>

      {/* Toolbar: Filters (if vocab tab) & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        {activeTab === 'vocabulary' && (
          <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-slate-900/40 border border-white/5">
            {[
              { id: 'all', label: language === 'bn' ? 'সব শব্দ' : 'All' },
              { id: 'new', label: language === 'bn' ? 'নতুন' : 'New' },
              { id: 'learning', label: language === 'bn' ? 'শিখছি' : 'Learning' },
              { id: 'familiar', label: language === 'bn' ? 'পরিচিত' : 'Familiar' },
              { id: 'mastered', label: language === 'bn' ? 'আয়ত্ত' : 'Mastered' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setVocabFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  vocabFilter === f.id
                    ? 'bg-linear-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        <div className="relative grow max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder={activeTab === 'vocabulary'
              ? (language === 'bn' ? 'শব্দভান্ডার খুঁজুন...' : 'Search vocabulary...')
              : (language === 'bn' ? 'বুকমার্ক করা শব্দ খুঁজুন...' : 'Search bookmarks...')}
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
          <div className="text-slate-400 font-semibold">{language === 'bn' ? 'ভোকাবুলারি ডাটা লোড হচ্ছে...' : 'Loading vocabulary data...'}</div>
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
                        title={isBookmarked
                          ? (language === 'bn' ? 'সংরক্ষণ তালিকা থেকে বাদ দিন' : 'Remove bookmark')
                          : (language === 'bn' ? 'সংরক্ষণ করুন' : 'Bookmark word')}
                      >
                        <Bookmark size={14} className={isBookmarked ? 'fill-cyan-400' : ''} />
                      </button>
                    </div>

                    <h2 className="text-xl font-extrabold text-white tracking-wide group-hover:text-indigo-400 transition-colors">
                      {item.word}
                    </h2>
                    {item.ipa && <p className="text-xs text-slate-500 font-mono mt-0.5">[{item.ipa}]</p>}
                    <p className="text-sm text-slate-300 mt-2 font-medium">{language === 'bn' ? 'অর্থ:' : 'Meaning:'} {item.bangla_meaning}</p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                    <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                      <span>{language === 'bn' ? 'সফলতা:' : 'Success:'}</span>
                      <span className="text-emerald-400 font-bold">{item.correct_count} {language === 'bn' ? 'বার' : 'times'}</span>
                      <span className="text-slate-500">|</span>
                      <span>{language === 'bn' ? 'ব্যর্থতা:' : 'Failure:'}</span>
                      <span className="text-rose-400 font-bold">{item.wrong_count} {language === 'bn' ? 'বার' : 'times'}</span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handlePlayAudio(item)}
                        className={`w-8 h-8 rounded-lg border-none flex items-center justify-center cursor-pointer transition ${
                          speakingWordId === item.word_id
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400'
                        }`}
                        title={language === 'bn' ? 'উচ্চারণ শুনুন' : 'Listen pronunciation'}
                      >
                        <Volume2 size={14} />
                      </button>
                      <Link
                        to={`/words/${item.word_id}`}
                        className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
                        title={language === 'bn' ? 'বিস্তারিত দেখুন' : 'View details'}
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
            <BookOpen size={36} className="mx-auto mb-4 text-slate-600" />
            <h3 className="font-extrabold text-white text-base">{language === 'bn' ? 'কোনো শব্দ পাওয়া যায়নি' : 'No words found'}</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
              {searchTerm
                ? (language === 'bn' ? 'অনুগ্রহ করে সার্চ কিওয়ার্ড পরিবর্তন করে দেখুন।' : 'Please try changing your search keywords.')
                : (language === 'bn' ? 'আপনার কারিকুলাম সম্পন্ন করে এই ফিল্টারের অধীনে শব্দ যোগ করুন।' : 'Complete curriculum lessons to unlock and add words to your vocabulary.')}
            </p>
          </div>
        )
      ) : (
        filteredBookmarks.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBookmarks.map(item => (
              <div key={item.word_id} className="card-card p-5 bg-slate-950/40 border border-white/10 hover:border-indigo-500/30 hover:scale-[1.01] hover:shadow-[0_12px_24px_rgba(99,102,241,0.03)] transition-all duration-300 relative flex flex-col justify-between group overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/3 rounded-full filter blur-xl pointer-events-none"></div>

                <div>
                  <div className="flex justify-between items-start mb-3">
                    {getFamiliarityBadge(item.familiarity)}
                    <button
                      onClick={() => handleToggleBookmark(item.word_id, true)}
                      className="w-8 h-8 rounded-lg border bg-cyan-500/10 border-cyan-500/20 text-cyan-400 flex items-center justify-center cursor-pointer hover:bg-cyan-500/20 transition-colors"
                      title={language === 'bn' ? 'সংরক্ষণ তালিকা থেকে বাদ দিন' : 'Remove bookmark'}
                    >
                      <Bookmark size={14} className="fill-cyan-400" />
                    </button>
                  </div>

                  <h2 className="text-xl font-extrabold text-white tracking-wide group-hover:text-indigo-400 transition-colors">
                    {item.word}
                  </h2>
                  {item.ipa && <p className="text-xs text-slate-500 font-mono mt-0.5">[{item.ipa}]</p>}
                  <p className="text-sm text-slate-300 mt-2 font-medium">{language === 'bn' ? 'অর্থ:' : 'Meaning:'} {item.bangla_meaning}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1.5">
                    <span>{language === 'bn' ? 'সফলতা:' : 'Success:'}</span>
                    <span className="text-emerald-400 font-bold">{item.correct_count} {language === 'bn' ? 'বার' : 'times'}</span>
                    <span className="text-slate-500">|</span>
                    <span>{language === 'bn' ? 'ব্যর্থতা:' : 'Failure:'}</span>
                    <span className="text-rose-400 font-bold">{item.wrong_count} {language === 'bn' ? 'বার' : 'times'}</span>
                  </div>

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handlePlayAudio(item)}
                      className={`w-8 h-8 rounded-lg border-none flex items-center justify-center cursor-pointer transition ${
                        speakingWordId === item.word_id
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400'
                      }`}
                      title={language === 'bn' ? 'উচ্চারণ শুনুন' : 'Listen pronunciation'}
                    >
                      <Volume2 size={14} />
                    </button>
                    <Link
                      to={`/words/${item.word_id}`}
                      className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition"
                      title={language === 'bn' ? 'বিস্তারিত দেখুন' : 'View details'}
                    >
                      <Eye size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state py-16 border border-dashed border-white/10 bg-slate-950/20 max-w-lg mx-auto">
            <Star size={36} className="mx-auto mb-4 text-slate-600" />
            <h3 className="font-extrabold text-white text-base">{language === 'bn' ? 'কোনো বুকমার্ক পাওয়া যায়নি' : 'No bookmarks found'}</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
              {searchTerm
                ? (language === 'bn' ? 'অনুগ্রহ করে সার্চ কিওয়ার্ড পরিবর্তন করে দেখুন।' : 'Please try changing your search keywords.')
                : (language === 'bn' ? 'লেসন বা ড্যাশবোর্ড থেকে ইংরেজি শব্দ বুকমার্ক করে রাখুন।' : 'Bookmark words from lessons or AI conversations to save them here.')}
            </p>
          </div>
        )
      )}
    </div>
  );
}

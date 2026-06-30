import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getChapters } from '../api/curriculum.js';
import { getProgress } from '../api/progress.js';
import {
  BookOpen, ShieldAlert, Lock, CheckCircle2, ChevronRight,
  RefreshCw, Layers, SkipForward, PlayCircle, RotateCcw
} from 'lucide-react';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';
import useAuth from '../hooks/useAuth.js';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const cacheKey = (userId) => `articulate_curriculum_${userId}`;

function readCache(userId) {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch { return null; }
}

function writeCache(userId, chapters, progress, placementChapter) {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify({
      chapters, progress, placementChapter, cachedAt: Date.now()
    }));
  } catch { /* quota exceeded */ }
}

function clearCache(userId) {
  try { localStorage.removeItem(cacheKey(userId)); } catch { /* ignore */ }
}

// Determine chapter access state given placement chapter + completion map
// Returns: 'skipped' | 'active' | 'completed' | 'locked'
function getChapterState(chapter, placementChapter, progress) {
  const chapProgress = progress?.chapters?.[chapter.id];
  const isCompleted = chapProgress?.status === 'COMPLETED';

  // Chapters before placement are "skipped" via placement test
  if (chapter.order_num < placementChapter) return 'skipped';
  if (isCompleted) return 'completed';
  return 'active'; // will be overridden to 'locked' below by caller
}

export default function Curriculum() {
  const { t, language } = useThemeLanguage();
  const { user } = useAuth();

  const [chapters, setChapters]             = useState([]);
  const [progress, setProgress]             = useState(null);
  const [placementChapter, setPlacement]    = useState(1);
  const [error, setError]                   = useState('');
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return;

    if (!forceRefresh) {
      const cached = readCache(user.id);
      if (cached) {
        setChapters(cached.chapters || []);
        setProgress(cached.progress);
        setPlacement(cached.placementChapter ?? 1);
        setLoading(false);
        // silently revalidate in background
        fetchData(true).catch(() => {});
        return;
      }
    }

    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const [chaptersData, progressData] = await Promise.all([
        getChapters(),
        getProgress().catch(() => null)
      ]);

      const placement = progressData?.placement_chapter ?? 1;
      setChapters(chaptersData || []);
      setProgress(progressData);
      setPlacement(placement);
      writeCache(user.id, chaptersData || [], progressData, placement);
    } catch (err) {
      setError(err.message || 'Chapters could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = () => {
    clearCache(user?.id);
    fetchData(true);
  };

  // Derive chapter states. Sequential rule:
  // - order_num < placement  → skipped
  // - order_num = placement  → active (first unlocked)
  // - order_num > placement  → active if every chapter from placement to (this-1) is completed; else locked
  // - already completed chapters are always re-accessible (practice)
  function computeChapterState(chapter) {
    const chapProgress = progress?.chapters?.[chapter.id];
    const isCompleted  = chapProgress?.status === 'COMPLETED';

    if (chapter.order_num < placementChapter) return 'skipped';
    if (isCompleted) return 'completed';

    // Check if all chapters from placement up to (this chapter - 1) are completed
    for (const c of chapters) {
      if (c.order_num >= placementChapter && c.order_num < chapter.order_num) {
        const cp = progress?.chapters?.[c.id];
        if (cp?.status !== 'COMPLETED') return 'locked';
      }
    }
    return 'active';
  }

  if (loading) {
    return (
      <div className="page-container text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4" />
        <div className="text-slate-400 font-semibold">{t('curr_loading')}</div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header border-b border-white/10 pb-4 mb-6">
        <div>
          <h1 className="page-title flex items-center gap-3 text-white">
            <span className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
              <Layers className="text-indigo-400" size={24} />
            </span>
            {t('curr_title')}
          </h1>
          <p className="page-subtitle text-slate-400">
            {language === 'bn'
              ? 'প্রতিটি অধ্যায় ক্রমানুসারে শেষ করুন — পূর্ববর্তীটি সম্পন্ন না করলে পরবর্তীটি খুলবে না।'
              : 'Complete each chapter in order to unlock the next one. You can always revisit completed chapters to practice.'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh curriculum"
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/8 text-xs font-semibold transition-colors disabled:opacity-50 shrink-0 self-start mt-1">
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="glass-alert glass-alert-error mb-6 flex items-center gap-2">
          <ShieldAlert size={16} /><span>{error}</span>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {chapters.length > 0 ? chapters.map((chapter) => {
          const state = computeChapterState(chapter);
          const chapProgress   = progress?.chapters?.[chapter.id];
          const completedLessons = chapProgress?.completed_lessons || 0;
          const totalLessons   = chapter.total_lessons || 5;
          const percentage     = totalLessons > 0
            ? Math.round((completedLessons / totalLessons) * 100) : 0;

          const isLocked    = state === 'locked';
          const isSkipped   = state === 'skipped';
          const isCompleted = state === 'completed';
          const isActive    = state === 'active';

          const card = (
            <div className={`card-card h-full flex flex-col justify-between p-6 relative overflow-hidden group transition-all duration-300
              ${isLocked
                ? 'bg-slate-950/60 border-white/5 opacity-55 cursor-not-allowed'
                : isSkipped
                  ? 'bg-gradient-to-br from-slate-950/40 to-amber-950/10 border-amber-500/15 hover:border-amber-500/35 hover:scale-[1.02] hover:shadow-[0_15px_30px_rgba(245,158,11,0.06)]'
                  : isCompleted
                    ? 'bg-slate-950/40 border-green-500/20 hover:border-green-500/35 hover:scale-[1.02] hover:shadow-[0_15px_30px_rgba(34,197,94,0.06)]'
                    : 'bg-slate-950/40 border-white/10 hover:border-indigo-500/40 hover:scale-[1.02] hover:shadow-[0_15px_30px_rgba(99,102,241,0.06)]'
              }`}>

              {/* Glow blob */}
              {!isLocked && (
                <div className={`absolute top-0 right-0 w-20 h-20 rounded-full filter blur-lg pointer-events-none transition-colors
                  ${isCompleted ? 'bg-green-500/5 group-hover:bg-green-500/10' : isSkipped ? 'bg-amber-500/5 group-hover:bg-amber-500/10' : 'bg-indigo-500/5 group-hover:bg-indigo-500/10'}`} />
              )}

              <div>
                {/* Top row: chapter number + status badge */}
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                    {t('curr_chapter')} {chapter.order_num}
                  </span>

                  {isLocked && (
                    <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border bg-slate-800/60 text-slate-500 border-slate-700/50">
                      <Lock size={9} /> Locked
                    </span>
                  )}
                  {isSkipped && (
                    <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/25">
                      <SkipForward size={9} /> Skipped
                    </span>
                  )}
                  {isCompleted && (
                    <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border bg-green-500/10 text-green-400 border-green-500/20">
                      <CheckCircle2 size={9} /> {t('curr_completed')}
                    </span>
                  )}
                  {isActive && !chapProgress && (
                    <span className="text-xs text-slate-500 font-bold">
                      {totalLessons} {t('curr_lessons')}
                    </span>
                  )}
                  {isActive && chapProgress && (
                    <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">
                      {t('curr_in_progress')}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className={`text-xl font-extrabold tracking-wide mb-2 transition-colors
                  ${isLocked ? 'text-slate-600' : isSkipped ? 'text-slate-300 group-hover:text-amber-400' : 'text-white group-hover:text-indigo-400'}`}>
                  {language === 'bn' ? (chapter.title_bn || chapter.title) : chapter.title}
                </h2>

                <p className={`text-sm leading-relaxed font-medium
                  ${isLocked ? 'text-slate-700' : 'text-slate-400'}`}>
                  {chapter.description || (language === 'bn'
                    ? 'চ্যাপ্টারের লেসনগুলো সম্পন্ন করুন।'
                    : 'Complete the lessons in this chapter to improve your English.')}
                </p>

                {/* Progress bar — only for active or completed */}
                {chapProgress && !isLocked && (
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                      <span>{completedLessons} / {totalLessons} {t('curr_lessons_completed')}</span>
                      <span>{percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900/60 rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-indigo-500 to-cyan-500'}`}
                        style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom action row */}
              <div className={`mt-6 flex items-center justify-between text-xs font-bold pt-4 border-t border-white/5 transition-colors
                ${isLocked   ? 'text-slate-700'
                : isSkipped  ? 'text-amber-500 group-hover:text-amber-400'
                : isCompleted? 'text-green-500 group-hover:text-green-400'
                :              'text-indigo-400 group-hover:text-indigo-300'}`}>
                {isLocked   && <span className="flex items-center gap-1.5"><Lock size={11} /> Complete the previous chapter first</span>}
                {isSkipped  && <span className="flex items-center gap-1.5"><RotateCcw size={11} /> Review (skipped by placement)</span>}
                {isCompleted&& <span className="flex items-center gap-1.5"><RotateCcw size={11} /> Practice again</span>}
                {isActive   && <span className="flex items-center gap-1.5"><PlayCircle size={11} /> {chapProgress ? 'Continue' : 'Start learning'}</span>}
                {!isLocked && <ChevronRight size={14} />}
              </div>
            </div>
          );

          // Locked chapters are not clickable
          if (isLocked) {
            return <div key={chapter.id}>{card}</div>;
          }

          return (
            <Link key={chapter.id} to={`/chapters/${chapter.id}`} className="card-link">
              {card}
            </Link>
          );
        }) : (
          <div className="empty-state col-span-full py-16 border border-dashed border-white/10 bg-slate-950/20">
            <BookOpen size={32} className="mx-auto mb-3 text-slate-600" />
            <h3 className="font-extrabold text-white text-base">{t('curr_empty')}</h3>
            <p className="text-xs text-slate-500 mt-1">{t('curr_empty_sub')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

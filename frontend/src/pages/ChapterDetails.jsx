import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getChapter } from '../api/curriculum.js';
import { getProgress } from '../api/progress.js';
import {
  Award, BookOpen, ShieldAlert, Sparkles, MessageCircle,
  CheckCircle2, PlayCircle, RotateCcw, RefreshCw, ChevronRight,
  Layers, FileText, Mic, ClipboardList
} from 'lucide-react';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';
import useAuth from '../hooks/useAuth.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cacheKey = (chapterId) => `articulate_chapter_${chapterId}`;

function readCache(chapterId) {
  try {
    const raw = localStorage.getItem(cacheKey(chapterId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch { return null; }
}

function writeCache(chapterId, chapter, lessons, progress) {
  try {
    localStorage.setItem(cacheKey(chapterId), JSON.stringify({
      chapter, lessons, progress, cachedAt: Date.now()
    }));
  } catch { /* quota */ }
}

function clearCache(chapterId) {
  try { localStorage.removeItem(cacheKey(chapterId)); } catch { /* ignore */ }
}

const LESSON_TYPE_ICON = {
  LEARN:    <BookOpen size={16} />,
  PRACTICE: <Mic size={16} />,
  TEST:     <ClipboardList size={16} />,
  REVIEW:   <RotateCcw size={16} />,
};

const LESSON_TYPE_COLOR = {
  LEARN:    'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  PRACTICE: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  TEST:     'text-amber-400 bg-amber-500/10 border-amber-500/20',
  REVIEW:   'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

export default function ChapterDetails() {
  const { id } = useParams();
  const { t, language } = useThemeLanguage();
  const { user } = useAuth();

  const [chapter, setChapter]   = useState(null);
  const [lessons, setLessons]   = useState([]);
  const [progress, setProgress] = useState(null);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = readCache(id);
      if (cached) {
        setChapter(cached.chapter);
        setLessons(cached.lessons || []);
        setProgress(cached.progress);
        setLoading(false);
        fetchData(true).catch(() => {});
        return;
      }
    }

    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const [result, progressData] = await Promise.all([
        getChapter(id),
        getProgress().catch(() => null)
      ]);
      setChapter(result.chapter);
      setLessons(result.lessons || []);
      setProgress(progressData);
      writeCache(id, result.chapter, result.lessons || [], progressData);
    } catch (err) {
      setError(err.message || 'Chapter could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = () => {
    clearCache(id);
    fetchData(true);
  };

  if (loading) {
    return (
      <div className="page-container text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4" />
        <div className="text-slate-400 font-semibold">{t('chap_loading')}</div>
      </div>
    );
  }

  const chapterProgress = progress?.chapters?.[chapter?.id];
  const completedLessons = chapterProgress?.completed_lessons || 0;
  const totalLessons = lessons.length || chapter?.total_lessons || 0;
  const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="page-header border-b border-white/10 pb-4 mb-6">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full mb-2 inline-flex items-center gap-1">
            <Layers size={9} /> {t('chap_details')}
          </span>
          <h1 className="page-title text-white mt-1">
            {language === 'bn' ? (chapter?.title_bn || chapter?.title) : chapter?.title}
          </h1>
          <p className="page-subtitle text-slate-400">
            {chapter?.description || t('chap_subtitle')}
          </p>
          {chapterProgress && (
            <div className="mt-3 space-y-1 max-w-xs">
              <div className="flex justify-between text-[10px] font-bold text-slate-400">
                <span>{completedLessons}/{totalLessons} lessons completed</span>
                <span>{percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-900/60 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }} />
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh chapter"
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

      {/* Lessons — 3 per row grid */}
      {lessons.length > 0 ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson, idx) => {
            const lessonProgress = progress?.lessons?.[lesson.id];
            const isCompleted = lessonProgress?.status === 'COMPLETED';
            const typeKey = lesson.type || 'LEARN';
            const typeColor = LESSON_TYPE_COLOR[typeKey] || LESSON_TYPE_COLOR.LEARN;

            return (
              <Link key={lesson.id} to={`/lessons/${lesson.id}`} className="card-link">
                <div className="card-card h-full flex flex-col justify-between p-5 bg-slate-950/40 border border-white/8 hover:border-indigo-500/40 hover:scale-[1.02] hover:shadow-[0_12px_24px_rgba(99,102,241,0.06)] transition-all duration-300 relative overflow-hidden group">

                  {isCompleted && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 size={16} className="text-green-400 opacity-80" />
                    </div>
                  )}

                  {/* Lesson number + type */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-black text-slate-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                      {t('curr_lessons')} {lesson.order_num || idx + 1}
                    </span>
                    {lesson.type && (
                      <span className={`flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded border ${typeColor}`}>
                        {LESSON_TYPE_ICON[typeKey]}
                        {lesson.type}
                      </span>
                    )}
                  </div>

                  {/* Icon + Title */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-xl border flex-shrink-0 transition-colors group-hover:border-indigo-500/40 ${typeColor}`}>
                      {LESSON_TYPE_ICON[typeKey] || <BookOpen size={16} />}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-extrabold text-white group-hover:text-indigo-400 transition-colors leading-snug">
                        {(language === 'bn' ? lesson.title_bn : lesson.title) || lesson.title}
                      </h2>
                      {lesson.objective_bn && language === 'bn' && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">
                          {lesson.objective_bn}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom CTA */}
                  <div className={`mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold transition-colors
                    ${isCompleted ? 'text-green-400 group-hover:text-green-300' : 'text-indigo-400 group-hover:text-indigo-300'}`}>
                    <span className="flex items-center gap-1.5">
                      {isCompleted
                        ? <><RotateCcw size={11} /> {t('chap_play_again')}</>
                        : <><PlayCircle size={11} /> {t('chap_start_lesson')}</>}
                    </span>
                    <ChevronRight size={13} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="empty-state py-16 border border-dashed border-white/10 bg-slate-950/20">
          <FileText size={32} className="mx-auto mb-3 text-slate-600" />
          <h3 className="font-extrabold text-white text-base">{t('chap_empty')}</h3>
          <p className="text-xs text-slate-500 mt-1">{t('chap_empty_sub')}</p>
        </div>
      )}

      {/* Chapter Evaluation section */}
      {lessons.length > 0 && (
        <div className="border-t border-dashed border-white/10 pt-6 mt-8">
          <h3 className="font-extrabold text-slate-300 text-sm mb-4 flex items-center gap-2">
            <Award size={16} className="text-cyan-400" />
            {t('chap_evaluation')}
          </h3>
          <Link to={`/chapters/${id}/conversation`} className="card-link">
            <div className="card-card bg-slate-950/60 border border-white/8 hover:border-indigo-500/35 hover:scale-[1.01] transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/4 rounded-full filter blur-2xl pointer-events-none group-hover:bg-cyan-500/8 transition-colors" />
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 group-hover:animate-pulse shrink-0">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-lg font-extrabold text-cyan-300 group-hover:text-cyan-200 transition-colors">
                      {t('chap_test_title')}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-lg">
                      {t('chap_test_subtitle')}
                    </p>
                  </div>
                </div>
                <button className="px-5 py-2.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 font-extrabold rounded-xl border border-cyan-500/30 text-xs transition-colors flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center">
                  <Sparkles size={13} /> {t('chap_start_test')}
                </button>
              </div>
            </div>
          </Link>
        </div>
      )}
    </div>
  );
}

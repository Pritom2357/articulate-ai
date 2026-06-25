import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getChapter } from '../api/curriculum.js';
import { getProgress } from '../api/progress.js';
import { Award, BookOpen, ShieldAlert, Sparkles, MessageCircle } from 'lucide-react';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';

export default function ChapterDetails() {
  const { id } = useParams();
  const { t } = useThemeLanguage();
  const [chapter, setChapter] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChapterAndProgress() {
      try {
        setLoading(true);
        const [result, progressData] = await Promise.all([
          getChapter(id),
          getProgress().catch(() => null)
        ]);
        setChapter(result.chapter);
        setLessons(result.lessons || []);
        if (progressData) {
          setProgress(progressData);
        }
      } catch (err) {
        setError(err.payload?.error || err.message || t('chap_loading_error') || 'চ্যাপ্টার লোড করা যায়নি।');
      } finally {
        setLoading(false);
      }
    }

    loadChapterAndProgress();
  }, [id, t]);

  if (loading) {
    return (
      <div className="page-container text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <div className="text-slate-400 font-semibold">{t('chap_loading')}</div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: '800px' }}>
      <div className="page-header border-b border-white/10 pb-4 mb-6">
        <div>
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full mb-2 inline-block">
            {t('chap_details')}
          </span>
          <h1 className="page-title text-white mt-1">
            {chapter?.title || `${t('curr_chapter')} ${chapter?.order_num || id}`}
          </h1>
          <p className="page-subtitle text-slate-400">
            {chapter?.description || t('chap_subtitle')}
          </p>
        </div>
      </div>

      {error && (
        <div className="glass-alert glass-alert-error mb-6 flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {lessons.map((lesson, idx) => {
          const lessonProgress = progress?.lessons?.[lesson.id];
          const isCompleted = lessonProgress?.status === 'COMPLETED';

          return (
            <Link key={lesson.id} to={`/lessons/${lesson.id}`} className="card-link">
              <div className="card-card hover:border-indigo-500/50 hover:scale-[1.01] hover:shadow-[0_12px_24px_rgba(99,102,241,0.04)] transition-all duration-300 bg-slate-950/40 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/3 rounded-full filter blur-xl pointer-events-none"></div>

                <div className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex-shrink-0 text-slate-400 group-hover:text-indigo-400 transition-colors">
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500 bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                          {t('curr_lessons')} {lesson.order_num || (idx + 1)}
                        </span>
                        {lesson.type && (
                          <span className="text-[9px] font-extrabold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.25 rounded">
                            {lesson.type}
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-[9px] font-black text-green-400 uppercase tracking-wider bg-green-500/10 border border-green-500/20 px-1.5 py-0.25 rounded flex items-center gap-0.5">
                            ✓ {t('curr_completed')}
                          </span>
                        )}
                      </div>
                      <h2 className="text-lg font-extrabold text-white mt-1.5 group-hover:text-indigo-400 transition-colors">
                        {lesson.title || `Lesson ${lesson.order_num || lesson.id}`}
                      </h2>
                      <p className="text-xs text-slate-400 leading-relaxed mt-1 font-medium">
                        {lesson.summary || lesson.objective_bn || 'লেসনটি শুরু করে উচ্চারণ ও স্পিকিং অনুশীলন করুন।'}
                      </p>
                    </div>
                  </div>

                  <span className={`text-xs font-bold whitespace-nowrap px-3 py-1.5 rounded-xl border transition-colors ${isCompleted ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'}`}>
                    {isCompleted ? t('chap_play_again') : t('chap_start_lesson')}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        {lessons.length > 0 && (
          <div className="border-t border-dashed border-white/10 pt-6 mt-4">
            <h3 className="font-extrabold text-slate-300 text-sm mb-4 flex items-center gap-2">
              <Award size={18} className="text-cyan-400" />
              {t('chap_evaluation')}
            </h3>

            <Link to={`/chapters/${id}/conversation`} className="card-link">
              <div className="card-card bg-gradient-to-r from-slate-950 via-indigo-950/20 to-slate-950 text-white hover:border-indigo-500/40 hover:scale-[1.01] hover:shadow-[0_20px_40px_rgba(6,182,212,0.05)] transition-all duration-300 border border-white/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full filter blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors"></div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 group-hover:animate-pulse">
                      <MessageCircle size={28} />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-cyan-300 group-hover:text-cyan-200 transition-colors">
                        {t('chap_test_title')}
                      </h2>
                      <p className="text-xs text-indigo-200 mt-1 leading-relaxed font-semibold max-w-xl">
                        {t('chap_test_subtitle')}
                      </p>
                    </div>
                  </div>

                  <button className="px-5 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold rounded-xl border-none cursor-pointer text-xs shadow-lg transition duration-300 flex items-center gap-2 self-stretch sm:self-auto justify-center">
                    <Sparkles size={14} /> {t('chap_start_test')}
                  </button>
                </div>
              </div>
            </Link>
          </div>
        )}

        {lessons.length === 0 && (
          <div className="empty-state py-16 border border-dashed border-white/10 bg-slate-950/20">
            <div className="text-4xl mb-3">📖</div>
            <h3 className="font-extrabold text-white text-base">{t('chap_empty')}</h3>
            <p className="text-xs text-slate-500 mt-1">{t('chap_empty_sub')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

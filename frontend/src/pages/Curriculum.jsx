import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getChapters } from '../api/curriculum.js';
import { getProgress } from '../api/progress.js';
import { BookOpen, ShieldAlert } from 'lucide-react';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';

export default function Curriculum() {
  const { t, language } = useThemeLanguage();
  const [chapters, setChapters] = useState([]);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChaptersAndProgress() {
      try {
        setLoading(true);
        const [chaptersData, progressData] = await Promise.all([
          getChapters(),
          getProgress().catch(() => null)
        ]);
        setChapters(chaptersData || []);
        if (progressData) {
          setProgress(progressData);
        }
      } catch (err) {
        setError(err.payload?.error || err.message || t('curr_loading_error') || (language === 'bn' ? 'চ্যাপ্টার লোড করা যায়নি।' : 'Chapters could not be loaded.'));
      } finally {
        setLoading(false);
      }
    }
    fetchChaptersAndProgress();
  }, [t]);

  if (loading) {
    return (
      <div className="page-container text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <div className="text-slate-400 font-semibold">{t('curr_loading')}</div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header border-b border-white/10 pb-4 mb-6">
        <div>
          <h1 className="page-title flex items-center gap-3 text-white">
            <span className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
              <BookOpen className="text-indigo-400" size={24} />
            </span>
            {t('curr_title')}
          </h1>
          <p className="page-subtitle text-slate-400">
            {t('curr_subtitle')}
          </p>
        </div>
      </div>

      {error && (
        <div className="glass-alert glass-alert-error mb-6 flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {chapters.length > 0 ? (
          chapters.map((chapter) => {
            const chapProgress = progress?.chapters?.[chapter.id];
            const isCompleted = chapProgress?.status === 'COMPLETED';
            const completedLessons = chapProgress?.completed_lessons || 0;
            const totalLessons = chapter.total_lessons || 5;
            const percentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

            return (
              <Link
                key={chapter.id}
                to={`/chapters/${chapter.id}`}
                className="card-link"
              >
                <div className="card-card h-full flex flex-col justify-between p-6 bg-slate-950/40 border border-white/10 hover:border-indigo-500/40 hover:scale-[1.02] hover:shadow-[0_15px_30px_rgba(99,102,241,0.05)] transition-all duration-300 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/5 rounded-full filter blur-lg pointer-events-none group-hover:bg-indigo-500/10 transition-colors"></div>

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                        {t('curr_chapter')} {chapter.order_num || chapter.id}
                      </span>
                      {chapProgress ? (
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${isCompleted ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                          {isCompleted ? t('curr_completed') : t('curr_in_progress')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 font-bold">
                          {totalLessons} {t('curr_lessons')}
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-extrabold text-white tracking-wide mb-2 group-hover:text-indigo-400 transition-colors">
                      {(language === 'bn' ? chapter.title_bn : chapter.title) || chapter.title || `${t('curr_chapter')} ${chapter.order_num || chapter.id}`}
                    </h2>
                    <p className="text-sm text-slate-400 leading-relaxed font-medium">
                      {(language === 'bn' ? chapter.description_bn : chapter.description) || chapter.description || t('curr_default_desc')}
                    </p>

                    {/* Progress Bar */}
                    {chapProgress && (
                      <div className="mt-4 space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold text-slate-400">
                          <span>{completedLessons} / {totalLessons} {t('curr_lessons_completed')}</span>
                          <span>{percentage}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900/60 rounded-full overflow-hidden border border-white/5">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-between text-xs font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors pt-4 border-t border-white/5">
                    <span>{t('curr_view_lessons')}</span>
                    <span>▶</span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="empty-state col-span-full py-16 border border-dashed border-white/10 bg-slate-950/20">
            <div className="text-4xl mb-3">📖</div>
            <h3 className="font-extrabold text-white text-base">{t('curr_empty')}</h3>
            <p className="text-xs text-slate-500 mt-1">{t('curr_empty_sub')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

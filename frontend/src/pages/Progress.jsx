import { useEffect, useState, useCallback } from 'react';
import { getProgress, getXpLog, getStreakCalendar } from '../api/progress.js';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, Clock, Flame, ShieldAlert, Sparkles, TrendingUp, CalendarDays, ChevronLeft, ChevronRight, Shield, Target, RefreshCw } from 'lucide-react';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';
import useAuth from '../hooks/useAuth.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const cacheKey = (userId) => `articulate_progress_${userId}`;

function readCache(userId) {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch { return null; }
}

function writeCache(userId, progress, xpLogs) {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify({ progress, xpLogs, cachedAt: Date.now() }));
  } catch { /* quota exceeded */ }
}

function clearCache(userId) {
  try { localStorage.removeItem(cacheKey(userId)); } catch { /* ignore */ }
}

// ─── Daily XP Goal Widget ───────────────────────────────────────────────────
const XP_GOAL_KEY = 'articulate_daily_xp_goal';
const DAILY_GOALS = [25, 50, 100, 200];

function DailyGoalWidget({ todayXp, language }) {
  const [goal, setGoal] = useState(() => Number(localStorage.getItem(XP_GOAL_KEY)) || 50);
  const [showPicker, setShowPicker] = useState(false);

  const saveGoal = (g) => {
    setGoal(g);
    localStorage.setItem(XP_GOAL_KEY, String(g));
    setShowPicker(false);
  };

  const pct = Math.min(100, Math.round((todayXp / goal) * 100));
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;
  const done = pct >= 100;

  return (
    <div className="card-card p-5 bg-gradient-to-br from-violet-950/20 to-slate-950/40 border border-violet-500/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/5 rounded-full filter blur-xl pointer-events-none" />
      <div className="flex items-center justify-between mb-4">
        <h3 className="card-title text-white flex items-center gap-2">
          <Target size={18} className="text-violet-400" />
          {language === 'bn' ? 'দৈনিক XP লক্ষ্য' : 'Daily XP Goal'}
        </h3>
        <button
          onClick={() => setShowPicker(p => !p)}
          className="text-[10px] font-bold text-violet-400 hover:text-violet-300 border border-violet-500/30 px-2.5 py-1 rounded-full bg-violet-500/10 cursor-pointer border-none transition"
        >
          {language === 'bn' ? 'লক্ষ্য পরিবর্তন' : 'Change goal'}
        </button>
      </div>

      {showPicker && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {DAILY_GOALS.map(g => (
            <button
              key={g}
              onClick={() => saveGoal(g)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition border ${
                goal === g
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-violet-500/15 hover:border-violet-500/30'
              }`}
            >
              {g} XP
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-6">
        {/* Radial SVG ring */}
        <div className="relative flex-shrink-0">
          <svg width="108" height="108" viewBox="0 0 108 108">
            <circle cx="54" cy="54" r={radius} fill="none" stroke="#ffffff08" strokeWidth="10" />
            <circle
              cx="54" cy="54" r={radius} fill="none"
              stroke={done ? '#a78bfa' : '#7c3aed'}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '54px 54px', transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className={`text-2xl font-black ${done ? 'text-violet-300' : 'text-white'}`}>{pct}%</div>
            <div className="text-[10px] text-slate-400 font-bold">{done ? '🎉' : `${todayXp}/${goal}`}</div>
          </div>
        </div>

        <div className="flex-1">
          {done ? (
            <div className="text-sm font-bold text-violet-300">
              {language === 'bn' ? 'অভিনন্দন! আজকের লক্ষ্য পূরণ হয়েছে! 🎉' : "You hit today's goal! 🎉"}
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-sm font-bold text-white">
                {language === 'bn' ? `আরও ${goal - todayXp} XP দরকার` : `${goal - todayXp} XP to go`}
              </div>
              <div className="text-xs text-slate-400">
                {language === 'bn' ? `আজকের লক্ষ্য: ${goal} XP` : `Today's target: ${goal} XP`}
              </div>
              <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Streak Shield Widget ────────────────────────────────────────────────────
const SHIELD_KEY = 'articulate_streak_shield';

function StreakShieldWidget({ streakDays, language }) {
  const [shields, setShields] = useState(() => {
    try { return JSON.parse(localStorage.getItem(SHIELD_KEY) || '0'); } catch { return 0; }
  });

  useEffect(() => {
    // Award 1 shield for every completed 7-day streak milestone
    const earned = Math.floor(streakDays / 7);
    const stored = Number(localStorage.getItem(`${SHIELD_KEY}_earned`) || '0');
    if (earned > stored) {
      const bonus = earned - stored;
      localStorage.setItem(`${SHIELD_KEY}_earned`, String(earned));
      setShields(prev => {
        const next = Math.min(3, prev + bonus); // cap at 3
        localStorage.setItem(SHIELD_KEY, String(next));
        return next;
      });
    }
  }, [streakDays]);

  const milestoneNext = (Math.floor(streakDays / 7) + 1) * 7;
  const progressToNext = streakDays % 7;

  return (
    <div className="card-card p-5 bg-gradient-to-br from-amber-950/20 to-slate-950/40 border border-amber-500/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full filter blur-xl pointer-events-none" />
      <h3 className="card-title text-white flex items-center gap-2 mb-4">
        <Shield size={18} className="text-amber-400" />
        {language === 'bn' ? 'স্ট্রিক শিল্ড' : 'Streak Shield'}
      </h3>
      <div className="flex items-center gap-4">
        {/* Shield Icons */}
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border text-lg transition-all ${
                i < shields
                  ? 'bg-amber-500/20 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-white/3 border-white/10 opacity-30'
              }`}
            >
              🛡️
            </div>
          ))}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-white mb-1">
            {shields > 0
              ? (language === 'bn' ? `${shields}টি ফ্রিজ শিল্ড সক্রিয়` : `${shields} Freeze Shield${shields > 1 ? 's' : ''} active`)
              : (language === 'bn' ? 'কোনো শিল্ড নেই' : 'No shields yet')}
          </div>
          <div className="text-[10px] text-slate-400">
            {language === 'bn'
              ? `${milestoneNext} দিনের স্ট্রিকে পরবর্তী শিল্ড পাবেন (${progressToNext}/7)`
              : `Next shield at ${milestoneNext}-day streak (${progressToNext}/7)`}
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-1.5">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
              style={{ width: `${(progressToNext / 7) * 100}%` }}
            />
          </div>
          {shields > 0 && (
            <div className="text-[10px] text-amber-300 mt-1.5">
              {language === 'bn' ? '⚡ একদিন মিস করলেও স্ট্রিক থাকবে!' : '⚡ Miss a day? Your streak is protected!'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const getLast7DaysData = (xpLogs, screenTimeData, t) => {
  const data = [];
  const today = new Date();
  const xpKey = t('chart_xp_bar');
  const screenTimeKey = t('chart_screentime_line');
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dateLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    
    // Calculate total XP gained on this day
    const dayXp = xpLogs
      .filter(log => {
        const logDate = new Date(log.created_at);
        return logDate.getFullYear() === d.getFullYear() &&
               logDate.getMonth() === d.getMonth() &&
               logDate.getDate() === d.getDate();
      })
      .reduce((sum, log) => sum + log.amount, 0);
      
    // Screen time on this day in minutes
    const dayScreenTimeSec = screenTimeData[dateString] || 0;
    const dayScreenTimeMin = Math.round(dayScreenTimeSec / 60);

    data.push({
      date: dateLabel,
      [xpKey]: dayXp,
      [screenTimeKey]: dayScreenTimeMin,
    });
  }
  
  return data;
};

export default function Progress() {
  const { t, language } = useThemeLanguage();
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [xpLogs, setXpLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [calendarActiveDates, setCalendarActiveDates] = useState([]);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);

  // Day specific activity popup details state
  const [selectedDayDetails, setSelectedDayDetails] = useState(null);

  const fetchProgressAndLogs = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return;

    if (!forceRefresh) {
      const cached = readCache(user.id);
      if (cached) {
        setProgress(cached.progress);
        setXpLogs(cached.xpLogs || []);
        setLoading(false);
        fetchProgressAndLogs(true).catch(() => {});
        return;
      }
    }

    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const [progRes, logsRes] = await Promise.all([getProgress(), getXpLog(100)]);
      setProgress(progRes);
      setXpLogs(logsRes || []);
      writeCache(user.id, progRes, logsRes || []);
    } catch (err) {
      setError(err.payload?.error || err.message || 'Progress could not be loaded.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchProgressAndLogs(); }, [fetchProgressAndLogs]);

  useEffect(() => {
    async function loadCalendar() {
      try {
        const calRes = await getStreakCalendar(calYear, calMonth);
        setCalendarActiveDates(calRes.map(r => new Date(r.active_date).getDate()));
      } catch { /* non-fatal */ }
    }
    loadCalendar();
  }, [calYear, calMonth]);

  const handleRefresh = () => {
    clearCache(user?.id);
    fetchProgressAndLogs(true);
  };

  if (loading && !progress) {
    return (
      <div className="page-container text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <div className="text-slate-400 font-semibold font-mono">{t('prog_loading')}</div>
      </div>
    );
  }

  const xpKey = t('chart_xp_bar');
  const screenTimeKey = t('chart_screentime_line');

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header border-b border-white/10 pb-4 mb-6">
        <div>
          <h1 className="page-title text-white flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
              <TrendingUp className="text-indigo-400" size={24} />
            </span>
            {t('prog_title')}
          </h1>
          <p className="page-subtitle text-slate-400">{t('prog_subtitle')}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Refresh progress"
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

      {progress && (
        <div className="space-y-6">
          {/* Daily Goal + Streak Shield Row */}
          {(() => {
            const todayKey = (() => {
              const d = new Date();
              return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            })();
            const screenTimeData = JSON.parse(localStorage.getItem('articulate_screen_time') || '{}');
            const todayXp = xpLogs
              .filter(log => {
                const d = new Date(log.created_at);
                const logKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                return logKey === todayKey;
              })
              .reduce((sum, log) => sum + log.amount, 0);
            return (
              <div className="grid gap-4 md:grid-cols-2">
                <DailyGoalWidget todayXp={todayXp} language={language} />
                <StreakShieldWidget streakDays={progress.streak_days ?? 0} language={language} />
              </div>
            );
          })()}

          {/* Key Stats Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-card p-5 bg-gradient-to-br from-indigo-950/20 to-slate-950/40 border border-white/5 hover:border-indigo-500/20 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full filter blur-lg pointer-events-none"></div>
              <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">{t('prog_xp_earned')}</div>
              <div className="text-3xl font-black text-indigo-400 flex items-baseline gap-1">
                <span>{progress.xp ?? 0}</span>
                <span className="text-xs text-slate-500 font-bold">{t('prog_points')}</span>
              </div>
            </div>

            <div className="card-card p-5 bg-gradient-to-br from-cyan-950/20 to-slate-950/40 border border-white/5 hover:border-cyan-500/20 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full filter blur-lg pointer-events-none"></div>
              <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">{t('prog_level')}</div>
              <div className="text-3xl font-black text-cyan-400 flex items-baseline gap-1">
                <span>Lvl {progress.level ?? 1}</span>
              </div>
            </div>

            <div className="card-card p-5 bg-gradient-to-br from-rose-950/20 to-slate-950/40 border border-white/5 hover:border-rose-500/20 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full filter blur-lg pointer-events-none"></div>
              <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">{t('prog_streak')}</div>
              <div className="text-3xl font-black text-rose-400 flex items-baseline gap-1">
                <span>{progress.streak_days ?? 0}</span>
                <span className="text-xs text-slate-500 font-bold">{t('prog_days')}</span>
                <Flame size={20} className="text-rose-500 ml-1.5 self-center animate-pulse" />
              </div>
            </div>
          </div>

          {/* Onboarding Placement Result Banner */}
          {progress.onboarding && (
            <div className="card-card bg-gradient-to-br from-indigo-950/20 via-slate-950/40 to-cyan-950/20 border border-indigo-500/20 relative overflow-hidden p-6 rounded-2xl shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none"></div>
              
              <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Sparkles size={16} className="text-cyan-400" /> {t('prog_placement')}
              </h3>
              
              <div className="grid gap-6 md:grid-cols-3 items-center">
                <div className="bg-white/3 border border-white/5 rounded-2xl p-4 text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">{t('prog_placed_lvl')}</div>
                  <div className="text-4xl font-black text-cyan-400 my-1">{progress.onboarding.assessed_level}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">
                    {t('prog_placed_chapter')} {progress.onboarding.assessed_level === 'B1' ? '3' : progress.onboarding.assessed_level === 'A2' ? '2' : '1'}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-400">{language === 'bn' ? 'ভোকাবুলারি নির্ভুলতা:' : 'Vocabulary accuracy:'}</span>
                    <span className="text-indigo-400">{Math.round(progress.onboarding.vocab_score)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${progress.onboarding.vocab_score}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-400">{language === 'bn' ? 'উচ্চারণ নির্ভুলতা:' : 'Pronunciation accuracy:'}</span>
                    <span className="text-cyan-400">{Math.round(progress.onboarding.pronunciation_score)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${progress.onboarding.pronunciation_score}%` }}></div>
                  </div>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3.5 rounded-xl border border-white/5 h-full flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-white block mb-1">{language === 'bn' ? 'এআই অ্যানালিস্ট ফিডব্যাক:' : 'AI Analyst Feedback:'}</span>
                    <span className="italic">"{progress.onboarding.ai_notes || (language === 'bn' ? 'কোনো বিবরণ উপলব্ধ নেই।' : 'No details available.')}"</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold mt-3">
                    {language === 'bn' ? 'অ্যাসেসমেন্টের তারিখ:' : 'Assessment Date:'} {new Date(progress.onboarding.assessed_at).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Streak Calendar Banner */}
          <div className="card-card p-6 bg-slate-950/40 border border-white/10 relative overflow-hidden">
            <div className="max-w-md mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="card-title text-white flex items-center gap-2 mb-1">
                    <CalendarDays size={18} className="text-rose-400" />
                    {t('cal_title')}
                  </h3>
                  <p className="text-xs text-slate-400">{t('cal_subtitle')}</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-900/50 rounded-lg p-1 border border-white/5">
                  <button 
                    onClick={() => {
                      if (calMonth === 1) { setCalMonth(12); setCalYear(calYear - 1); }
                      else { setCalMonth(calMonth - 1); }
                      setSelectedDayDetails(null);
                    }}
                    className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white border-none bg-transparent cursor-pointer"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-bold text-white min-w-[100px] text-center">
                    {new Date(calYear, calMonth - 1).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' })}
                  </span>
                  <button 
                    onClick={() => {
                      if (calMonth === 12) { setCalMonth(1); setCalYear(calYear + 1); }
                      else { setCalMonth(calMonth + 1); }
                      setSelectedDayDetails(null);
                    }}
                    className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white border-none bg-transparent cursor-pointer"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {/* Streak Calendar grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
                {(language === 'bn' 
                  ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি'] 
                  : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                ).map(day => (
                  <div key={day} className="text-[10px] font-bold text-slate-500 uppercase py-1">{day}</div>
                ))}
                {Array.from({ length: new Date(calYear, calMonth - 1, 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                {Array.from({ length: new Date(calYear, calMonth, 0).getDate() }).map((_, i) => {
                  const dateNum = i + 1;
                  const isActive = calendarActiveDates.includes(dateNum);
                  
                  // Get logs and XP for this day
                  const dayLogs = xpLogs.filter(log => {
                    const logDate = new Date(log.created_at);
                    return logDate.getDate() === dateNum && 
                           logDate.getMonth() + 1 === calMonth && 
                           logDate.getFullYear() === calYear;
                  });
                  const dayXp = dayLogs.reduce((sum, log) => sum + log.amount, 0);

                  const isToday = new Date().getDate() === dateNum && new Date().getMonth() + 1 === calMonth && new Date().getFullYear() === calYear;
                  
                  // Heatmap logic colors
                  let cellClass = "";
                  if (dayXp >= 100) {
                    cellClass = "bg-rose-600 text-white border border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)] hover:scale-108";
                  } else if (dayXp >= 50) {
                    cellClass = "bg-rose-500/40 text-rose-200 border border-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.15)] hover:scale-108";
                  } else if (dayXp > 0 || isActive) {
                    cellClass = "bg-rose-500/15 text-rose-300 border border-rose-500/20 hover:scale-108";
                  } else {
                    cellClass = "bg-slate-900/40 text-slate-500 border border-white/5 hover:bg-slate-900/70 hover:text-slate-300";
                  }
                  
                  return (
                    <div 
                      key={dateNum}
                      onClick={() => {}}
                      className={`aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-300 cursor-pointer ${cellClass} ${isToday ? 'ring-2 ring-indigo-500' : ''}`}
                      title={dayXp > 0 ? `${dayXp} XP` : ''}
                    >
                      {dateNum}
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-white/5 text-xs text-slate-400 gap-2">
                <div className="flex items-center gap-1.5">
                  <span>{t('cal_legend')}</span>
                  <div className="flex gap-1 items-center ml-1">
                    <span className="w-3 h-3 rounded bg-slate-900/40 border border-white/5" title={t('cal_legend_none')}></span>
                    <span className="w-3 h-3 rounded bg-rose-500/15 border border-rose-500/20" title={t('cal_legend_low')}></span>
                    <span className="w-3 h-3 rounded bg-rose-500/40 border border-rose-500/30" title={t('cal_legend_mid')}></span>
                    <span className="w-3 h-3 rounded bg-rose-600" title={t('cal_legend_high')}></span>
                  </div>
                </div>
                <div className="font-bold text-slate-300">
                  {language === 'bn' ? `ধারাবাহিকতা: ${progress.streak_days} দিন` : `Streak: ${progress.streak_days} Days`}
                </div>
              </div>

              {/* Day Specific details panel */}
              {selectedDayDetails && (
                <div className="mt-5 p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/15 animate-fade-in text-left">
                  <div className="flex justify-between items-center border-b border-indigo-500/10 pb-2 mb-3">
                    <h4 className="text-xs font-black text-indigo-300 flex items-center gap-1.5">
                      <span>📅</span> {t('cal_selected_details')}: {selectedDayDetails.day} {new Date(calYear, calMonth - 1).toLocaleString(language === 'bn' ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' })}
                    </h4>
                    <button 
                      onClick={() => setSelectedDayDetails(null)} 
                      className="text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-white border-none bg-transparent cursor-pointer"
                    >
                      {language === 'bn' ? 'বন্ধ করুন' : 'Close'}
                    </button>
                  </div>
                  <div className="text-xs text-slate-300">
                    <div className="mb-2 font-semibold">
                      {t('prog_xp_earned')}: <span className="text-sm font-black text-indigo-400">+{selectedDayDetails.xp} XP</span>
                    </div>
                    {selectedDayDetails.logs.length > 0 ? (
                      <div className="space-y-1.5 mt-2">
                        <div className="font-bold text-slate-400 mb-1">{t('cal_activity_logs')}</div>
                        {selectedDayDetails.logs.map((log) => (
                          <div key={log.log_id} className="flex items-center gap-2 p-1.5 rounded-lg bg-white/3 border border-white/5">
                            <span className="text-indigo-400 font-bold flex-shrink-0">+{log.amount} XP</span>
                            <span className="text-slate-200 capitalize font-medium">{log.reason ? log.reason.replace('_', ' ') : 'Learning Activity'}</span>
                            <span className="text-[10px] text-slate-500 font-mono ml-auto">
                              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-500 italic text-center py-2">{t('cal_no_activity')}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recharts Composed Chart (Weekly Progress & Screen Time) */}
          <div className="card-card bg-slate-950/40 border border-white/10 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full filter blur-xl pointer-events-none"></div>
            
            <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
              <div>
                <h3 className="card-title text-white flex items-center gap-2 font-black">
                  <TrendingUp className="text-cyan-400" size={20} /> 
                  {t('chart_title')}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{t('chart_desc')}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold bg-white/5 border border-white/5 rounded-full px-3 py-1.5">
                <Clock size={12} className="text-indigo-400" />
                <span>
                  {t('chart_today_use')} {Math.round((JSON.parse(localStorage.getItem('articulate_screen_time') || '{}')[new Date().toISOString().split('T')[0]] || 0) / 60)} {t('chart_minutes')}
                </span>
              </div>
            </div>

            {/* Recharts Render Container */}
            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={getLast7DaysData(xpLogs, JSON.parse(localStorage.getItem('articulate_screen_time') || '{}'), t)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#818cf8" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#1e293b', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                    labelStyle={{ fontWeight: 'black', color: '#818cf8', marginBottom: '4px' }}
                  />
                  <Bar yAxisId="left" name={xpKey} dataKey={xpKey} fill="url(#colorXp)" barSize={22} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" name={screenTimeKey} type="monotone" dataKey={screenTimeKey} stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 4 }} activeDot={{ r: 6 }} />
                  
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.45}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Badges & Chapter Progress Lists Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="card-card p-5 bg-slate-950/40 border border-white/10">
              <h3 className="card-title text-white flex items-center gap-2 mb-4">
                <Award size={18} className="text-yellow-400" />
                {language === 'bn' ? 'অর্জিত ব্যাজসমূহ (Badges)' : 'Earned Badges'}
              </h3>
              {progress.badges?.length ? (
                <ul className="space-y-2">
                  {progress.badges.map((badge) => (
                    <li key={badge.badge_id} className={`badge-item p-3.5 rounded-xl border flex gap-3 items-start transition duration-200 ${badge.earned ? 'border-indigo-500/20 bg-indigo-500/5' : 'border-slate-800 bg-slate-900/20 opacity-50'}`}>
                      <div className="flex-shrink-0 mt-0.5">
                        {badge.icon_url && (badge.icon_url.startsWith('http') || badge.icon_url.startsWith('/')) ? (
                          <img src={badge.icon_url} alt={badge.title} className="w-8 h-8 object-contain" />
                        ) : (
                          <span className="text-2xl">{badge.icon_url || '🏆'}</span>
                        )}
                      </div>
                      <div className="flex-grow">
                        <div className="font-bold flex items-center gap-2">
                          <span className={badge.earned ? 'text-indigo-200' : 'text-slate-500'}>{badge.title}</span>
                          {badge.earned ? (
                            <span className="text-[9px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full ml-auto">UNLOCKED</span>
                          ) : (
                            <span className="text-[9px] font-bold bg-slate-800/80 border border-slate-700/50 text-slate-500 px-2 py-0.5 rounded-full ml-auto">LOCKED</span>
                          )}
                        </div>
                        <div className="text-slate-400 text-xs mt-1 leading-relaxed">{badge.description}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-xs italic">{language === 'bn' ? 'কোনো ব্যাজ এখনো আনলক করা হয়নি।' : 'No badges unlocked yet.'}</p>
              )}
            </div>

            <div className="card-card p-5 bg-slate-950/40 border border-white/10">
              <h3 className="card-title text-white flex items-center gap-2 mb-4">
                <span>📖</span>
                {language === 'bn' ? 'চ্যাপ্টার প্রগ্রেস (Chapter progress)' : 'Chapter Progress'}
              </h3>
              {progress.chapters ? (
                <ul className="space-y-3">
                  {Object.entries(progress.chapters).map(([chapterId, chapter]) => (
                    <li key={chapterId} className="p-3 border border-white/5 rounded-xl bg-white/2">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-white text-sm">{chapter.chapter_title || `Chapter ${chapterId}`}</div>
                        <div className="text-xs text-indigo-300 font-bold">{chapter.completion_pct ?? 0}% {language === 'bn' ? 'সম্পন্ন' : 'completed'}</div>
                      </div>
                      {/* Custom premium slider progress bar */}
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full transition-all duration-300" style={{ width: `${chapter.completion_pct ?? 0}%` }}></div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-xs italic">{language === 'bn' ? 'কারিকুলাম প্রগ্রেস উপলব্ধ নেই।' : 'No curriculum progress available.'}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

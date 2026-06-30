import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api/progress.js';
import useAuth from '../hooks/useAuth.js';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';
import PageLoader from '../components/PageLoader.jsx';
import {
  Zap, Flame, BookOpen, CheckCircle2, Star, TrendingUp, TrendingDown,
  RefreshCw, BarChart2, Layers, ChevronRight, Trophy, Clock, Target
} from 'lucide-react';

// ─── cache ────────────────────────────────────────────────────────────────────
const CACHE_TTL = 3 * 60 * 1000;
function cacheKey(uid) { return `articulate_dashboard_${uid}`; }
function readCache(uid) {
  try {
    const r = localStorage.getItem(cacheKey(uid));
    if (!r) return null;
    const p = JSON.parse(r);
    if (Date.now() - p.cachedAt > CACHE_TTL) return null;
    return p.data;
  } catch { return null; }
}
function writeCache(uid, data) {
  try { localStorage.setItem(cacheKey(uid), JSON.stringify({ data, cachedAt: Date.now() })); } catch {}
}
function clearCache(uid) { try { localStorage.removeItem(cacheKey(uid)); } catch {} }

// ─── helpers ──────────────────────────────────────────────────────────────────
function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

function getTodayScreenMin() {
  try {
    const data = JSON.parse(localStorage.getItem('articulate_screen_time') || '{}');
    const today = new Date().toISOString().split('T')[0];
    return Math.round((data[today] || 0) / 60);
  } catch { return 0; }
}

function getWeekScreenMins() {
  try {
    const data = JSON.parse(localStorage.getItem('articulate_screen_time') || '{}');
    const days = getLast7Days();
    return days.map(d => ({ day: d, mins: Math.round((data[d] || 0) / 60) }));
  } catch { return []; }
}

function levelLabel(level) {
  if (level >= 10) return 'Expert';
  if (level >= 7)  return 'Advanced';
  if (level >= 4)  return 'Intermediate';
  return 'Beginner';
}

function xpForLevel(level) { return level * 500; }

// ─── sub-components ───────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
    cyan:   'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    amber:  'bg-amber-500/10 border-amber-500/20 text-amber-400',
    emerald:'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    rose:   'bg-rose-500/10 border-rose-500/20 text-rose-400',
  };
  return (
    <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4 flex items-start gap-3">
      <div className={`p-2.5 rounded-xl border ${colors[color]} shrink-0`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-xl font-extrabold text-white">{value}</p>
        {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function WordChip({ word, dir }) {
  const isGood = dir === 'best';
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-xl border ${isGood ? 'bg-emerald-900/20 border-emerald-500/20' : 'bg-rose-900/20 border-rose-500/20'}`}>
      <div>
        <span className={`text-sm font-extrabold ${isGood ? 'text-emerald-300' : 'text-rose-300'}`}>{word.word}</span>
        <span className="text-slate-500 text-[10px] ml-2">{word.bangla_meaning}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isGood
          ? <span className="text-[10px] font-bold text-emerald-400">{word.correct_count}x correct</span>
          : <span className="text-[10px] font-bold text-rose-400">{word.wrong_count}x wrong</span>
        }
      </div>
    </div>
  );
}

function XpBar({ day, xp, maxXp, screenMin }) {
  const pct = maxXp > 0 ? Math.min((xp / maxXp) * 100, 100) : 0;
  const label = new Date(day + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' });
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <div className="text-[10px] text-slate-400 font-semibold">{xp > 0 ? xp : ''}</div>
      <div className="w-full flex flex-col justify-end" style={{ height: '60px' }}>
        <div
          className="w-full rounded-t-sm bg-indigo-500/70 transition-all duration-500"
          style={{ height: `${pct}%`, minHeight: xp > 0 ? '4px' : '0' }}
        />
        {screenMin > 0 && (
          <div className="w-full h-1 bg-cyan-500/40 mt-0.5 rounded-sm" title={`${screenMin}m screen time`} />
        )}
      </div>
      <div className="text-[10px] text-slate-500">{label}</div>
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const { language } = useThemeLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const screenDays = getWeekScreenMins();
  const todayScreenMin = getTodayScreenMin();

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!user?.id) return;

    if (!forceRefresh) {
      const cached = readCache(user.id);
      if (cached) {
        setData(cached);
        setLoading(false);
        fetchData(true).catch(() => {});
        return;
      }
    }

    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await getDashboard();
      writeCache(user.id, res);
      setData(res);
    } catch (e) {
      setError(e.message || 'Failed to load dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefresh = () => { clearCache(user?.id); fetchData(true); };

  if (loading) return <PageLoader text={language === 'bn' ? 'ড্যাশবোর্ড লোড হচ্ছে…' : 'Loading dashboard…'} />;

  const stats = data?.stats || {};
  const xp = Number(stats.xp || 0);
  const level = Number(stats.level || 1);
  const streak = Number(stats.streak_days || 0);
  const xpToNext = xpForLevel(level);
  const xpPct = Math.min((xp % xpToNext) / xpToNext * 100, 100);

  // Build 7-day XP map from xp_7days
  const xp7Map = {};
  (data?.xp_7days || []).forEach(r => { xp7Map[r.day] = Number(r.total_xp); });
  const days7 = getLast7Days();
  const maxDayXp = Math.max(...days7.map(d => xp7Map[d] || 0), 1);

  const wordCounts = data?.word_counts || { mastered: 0, familiar: 0, learning: 0 };
  const totalWords = Number(wordCounts.mastered || 0) + Number(wordCounts.familiar || 0) + Number(wordCounts.learning || 0);

  const firstName = user?.name?.split(' ')[0] || 'Learner';
  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return language === 'bn' ? 'শুভ সকাল' : 'Good morning';
    if (h < 17) return language === 'bn' ? 'শুভ বিকেল' : 'Good afternoon';
    return language === 'bn' ? 'শুভ সন্ধ্যা' : 'Good evening';
  })();

  return (
    <div className="page-container animate-fade-in max-w-4xl mx-auto">

      {/* header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-white">
            {greeting}, {firstName}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {language === 'bn' ? `আজ ${todayScreenMin} মিনিট পড়েছেন` : `${todayScreenMin} min of study today`}
            {streak > 0 && <span className="ml-2 text-amber-400 font-semibold">· {streak} {language === 'bn' ? 'দিনের ধারা' : 'day streak'}</span>}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-white/8 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          {language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-900/30 border border-red-500/20 rounded-xl text-sm text-red-300">{error}</div>}

      {/* level bar */}
      <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs font-extrabold text-indigo-300">{level}</div>
            <div>
              <p className="text-xs font-extrabold text-slate-200">{levelLabel(level)}</p>
              <p className="text-[10px] text-slate-500">{language === 'bn' ? 'লেভেল' : 'Level'} {level}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-extrabold text-indigo-300">{xp.toLocaleString()} XP</p>
            <p className="text-[10px] text-slate-500">{language === 'bn' ? 'পরবর্তী লেভেলে' : 'next level'}: {xpToNext.toLocaleString()} XP</p>
          </div>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-linear-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-700" style={{ width: `${xpPct}%` }} />
        </div>
      </div>

      {/* stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <StatCard icon={Zap}        label={language === 'bn' ? 'মোট XP' : 'Total XP'}          value={xp.toLocaleString()}   color="indigo" />
        <StatCard icon={Flame}      label={language === 'bn' ? 'ধারা (Streak)' : 'Streak'}       value={`${streak}d`}           color="amber" />
        <StatCard icon={BookOpen}   label={language === 'bn' ? 'শেখা শব্দ' : 'Words Learned'}    value={totalWords}             color="cyan" />
        <StatCard icon={Clock}      label={language === 'bn' ? 'আজকের সময়' : 'Today'}            value={`${todayScreenMin}m`}   color="emerald" />
      </div>

      {/* word familiarity pills */}
      {totalWords > 0 && (
        <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4 mb-5">
          <p className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wide">{language === 'bn' ? 'শব্দ প্রগতি' : 'Word Progress'}</p>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: language === 'bn' ? 'দক্ষ' : 'Mastered', count: wordCounts.mastered, color: 'bg-emerald-500/20 border-emerald-500/25 text-emerald-300' },
              { label: language === 'bn' ? 'পরিচিত' : 'Familiar', count: wordCounts.familiar, color: 'bg-indigo-500/20 border-indigo-500/25 text-indigo-300' },
              { label: language === 'bn' ? 'শিখছি' : 'Learning', count: wordCounts.learning, color: 'bg-amber-500/20 border-amber-500/25 text-amber-300' },
            ].map(p => (
              <div key={p.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${p.color}`}>
                {p.count} <span className="font-medium opacity-80">{p.label}</span>
              </div>
            ))}
          </div>
          {/* bar */}
          <div className="mt-3 flex rounded-full overflow-hidden h-2">
            {Number(wordCounts.mastered) > 0  && <div className="bg-emerald-500" style={{ width: `${(wordCounts.mastered / totalWords) * 100}%` }} />}
            {Number(wordCounts.familiar) > 0  && <div className="bg-indigo-500"  style={{ width: `${(wordCounts.familiar / totalWords) * 100}%` }} />}
            {Number(wordCounts.learning) > 0  && <div className="bg-amber-500"   style={{ width: `${(wordCounts.learning / totalWords) * 100}%` }} />}
          </div>
        </div>
      )}

      {/* 7-day activity chart */}
      <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
            <BarChart2 size={12} /> {language === 'bn' ? 'গত ৭ দিনের কার্যকলাপ' : 'Last 7 Days Activity'}
          </p>
          <div className="flex items-center gap-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-indigo-500/70 inline-block" /> XP</span>
            <span className="flex items-center gap-1"><span className="w-2 h-1 rounded-sm bg-cyan-500/40 inline-block" /> {language === 'bn' ? 'সময়' : 'Time'}</span>
          </div>
        </div>
        <div className="flex gap-1 items-end">
          {days7.map((day, i) => (
            <XpBar key={day} day={day} xp={xp7Map[day] || 0} maxXp={maxDayXp} screenMin={screenDays[i]?.mins || 0} />
          ))}
        </div>
      </div>

      {/* current chapter */}
      {data?.current_chapter && (
        <div className="mb-5">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{language === 'bn' ? 'বর্তমান অধ্যায়' : 'Currently Studying'}</p>
          <Link
            to={`/chapters/${data.current_chapter.id}`}
            className="flex items-center justify-between bg-slate-900/60 border border-indigo-500/20 hover:border-indigo-500/40 rounded-2xl p-4 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                <Target size={16} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-200 group-hover:text-white transition-colors">
                  {language === 'bn' ? (data.current_chapter.title_bn || data.current_chapter.title) : data.current_chapter.title}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {data.current_chapter.completed_lessons}/{data.current_chapter.total_lessons} {language === 'bn' ? 'লেসন সম্পন্ন' : 'lessons done'}
                  · {data.current_chapter.completion_pct}%
                </p>
                <div className="mt-1.5 w-40 h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${data.current_chapter.completion_pct}%` }} />
                </div>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" />
          </Link>
        </div>
      )}

      {/* best / worst words */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        {data?.best_words?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <TrendingUp size={12} className="text-emerald-400" /> {language === 'bn' ? 'সেরা শব্দ' : 'Best Words'}
            </p>
            <div className="space-y-2">
              {data.best_words.map((w, i) => <WordChip key={i} word={w} dir="best" />)}
            </div>
          </div>
        )}
        {data?.worst_words?.length > 0 && (
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <TrendingDown size={12} className="text-rose-400" /> {language === 'bn' ? 'কঠিন শব্দ' : 'Needs Practice'}
            </p>
            <div className="space-y-2">
              {data.worst_words.map((w, i) => <WordChip key={i} word={w} dir="worst" />)}
            </div>
          </div>
        )}
      </div>

      {/* quick links */}
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{language === 'bn' ? 'দ্রুত যান' : 'Quick Access'}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/curriculum', icon: BookOpen,   label: language === 'bn' ? 'পাঠ্যক্রম' : 'Curriculum',  color: 'indigo' },
            { to: '/flashcards', icon: Layers,      label: language === 'bn' ? 'ফ্ল্যাশকার্ড' : 'Flashcards', color: 'cyan' },
            { to: '/progress',   icon: BarChart2,   label: language === 'bn' ? 'প্রগতি' : 'Progress',      color: 'emerald' },
            { to: '/leaderboard',icon: Trophy,      label: language === 'bn' ? 'লিডারবোর্ড' : 'Leaderboard', color: 'amber' },
          ].map(({ to, icon: Icon, label, color }) => {
            const cls = {
              indigo: 'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40 text-indigo-300',
              cyan:   'bg-cyan-500/10 border-cyan-500/20 hover:border-cyan-500/40 text-cyan-300',
              emerald:'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-300',
              amber:  'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40 text-amber-300',
            }[color];
            return (
              <Link key={to} to={to} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-colors ${cls}`}>
                <Icon size={20} />
                <span className="text-xs font-bold">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

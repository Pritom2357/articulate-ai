import { useEffect, useState } from 'react';
import { getProgress, getXpLog } from '../api/progress.js';
import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Award, Clock, Flame, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';

const getLast7DaysData = (xpLogs, screenTimeData) => {
  const data = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dateLabel = d.toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' });
    
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
      "XP অর্জিত (Progress)": dayXp,
      "স্ক্রিন টাইম (মিনিট)": dayScreenTimeMin,
    });
  }
  
  return data;
};

export default function Progress() {
  const [progress, setProgress] = useState(null);
  const [xpLogs, setXpLogs] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProgressData() {
      try {
        setLoading(true);
        const [progRes, logsRes] = await Promise.all([
          getProgress(),
          getXpLog(100)
        ]);
        setProgress(progRes);
        setXpLogs(logsRes || []);
      } catch (err) {
        setError(err.payload?.error || err.message || 'অগ্রগতি লোড করা যায়নি।');
      } finally {
        setLoading(false);
      }
    }

    loadProgressData();
  }, []);

  if (loading && !progress) {
    return (
      <div className="page-container text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <div className="text-slate-400 font-semibold font-mono">অগ্রগতি বিশ্লেষণ করা হচ্ছে...</div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header border-b border-white/10 pb-4 mb-6">
        <div>
          <h1 className="page-title text-white flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
              <TrendingUp className="text-indigo-400" size={24} />
            </span>
            অগ্রগতি ড্যাশবোর্ড (My Progress)
          </h1>
          <p className="page-subtitle text-slate-400">আপনার শেখার অগ্রগতি, এক্সপি অর্জন এবং স্ক্রিন টাইম বিশ্লেষণ একনজরে দেখুন।</p>
        </div>
      </div>

      {error && (
        <div className="glass-alert glass-alert-error mb-6 flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {progress && (
        <div className="space-y-6">
          {/* Key Stats Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="card-card p-5 bg-gradient-to-br from-indigo-950/20 to-slate-950/40 border border-white/5 hover:border-indigo-500/20 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full filter blur-lg pointer-events-none"></div>
              <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">XP অর্জিত (Total XP)</div>
              <div className="text-3xl font-black text-indigo-400 flex items-baseline gap-1">
                <span>{progress.xp ?? 0}</span>
                <span className="text-xs text-slate-500 font-bold">Points</span>
              </div>
            </div>

            <div className="card-card p-5 bg-gradient-to-br from-cyan-950/20 to-slate-950/40 border border-white/5 hover:border-cyan-500/20 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/5 rounded-full filter blur-lg pointer-events-none"></div>
              <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">আপনার লেভেল (Current Level)</div>
              <div className="text-3xl font-black text-cyan-400 flex items-baseline gap-1">
                <span>Lvl {progress.level ?? 1}</span>
              </div>
            </div>

            <div className="card-card p-5 bg-gradient-to-br from-rose-950/20 to-slate-950/40 border border-white/5 hover:border-rose-500/20 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/5 rounded-full filter blur-lg pointer-events-none"></div>
              <div className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-2">অধ্যবসায় (Active Streak)</div>
              <div className="text-3xl font-black text-rose-400 flex items-baseline gap-1">
                <span>{progress.streak_days ?? 0}</span>
                <span className="text-xs text-slate-500 font-bold">Days</span>
                <Flame size={20} className="text-rose-500 ml-1.5 self-center animate-pulse" />
              </div>
            </div>
          </div>

          {/* Onboarding Placement Result Banner */}
          {progress.onboarding && (
            <div className="card-card bg-gradient-to-br from-indigo-950/20 via-slate-950/40 to-cyan-950/20 border border-indigo-500/20 relative overflow-hidden p-6 rounded-2xl shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none"></div>
              
              <h3 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Sparkles size={16} className="text-cyan-400" /> প্লেসমেন্ট পরীক্ষার মূল্যায়ন (Placement Assessment)
              </h3>
              
              <div className="grid gap-6 md:grid-cols-3 items-center">
                <div className="bg-white/3 border border-white/5 rounded-2xl p-4 text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Placed level</div>
                  <div className="text-4xl font-black text-cyan-400 my-1">{progress.onboarding.assessed_level}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">
                    Placed at Chapter {progress.onboarding.assessed_level === 'B1' ? '3' : progress.onboarding.assessed_level === 'A2' ? '2' : '1'}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-400">Vocabulary accuracy:</span>
                    <span className="text-indigo-400">{Math.round(progress.onboarding.vocab_score)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${progress.onboarding.vocab_score}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-400">Pronunciation accuracy:</span>
                    <span className="text-cyan-400">{Math.round(progress.onboarding.pronunciation_score)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${progress.onboarding.pronunciation_score}%` }}></div>
                  </div>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3.5 rounded-xl border border-white/5 h-full flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-white block mb-1">AI Analyst Feedback:</span>
                    <span className="italic">"{progress.onboarding.ai_notes || 'কোনো বিবরণ উপলব্ধ নেই।'}"</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold mt-3">
                    অ্যাসেসমেন্টের তারিখ: {new Date(progress.onboarding.assessed_at).toLocaleDateString('bn-BD')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recharts Composed Chart (Weekly Progress & Screen Time) */}
          <div className="card-card bg-slate-950/40 border border-white/10 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full filter blur-xl pointer-events-none"></div>
            
            <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
              <div>
                <h3 className="card-title text-white flex items-center gap-2 font-black">
                  <TrendingUp className="text-cyan-400" size={20} /> 
                  সাপ্তাহিক স্ক্রিন টাইম ও অগ্রগতি বিশ্লেষণ
                </h3>
                <p className="text-xs text-slate-400 mt-1">গত ৭ দিনে প্রতিদিনের অর্জিত XP এবং অ্যাপ ব্যবহারের সক্রিয় সময়ের তুলনামূলক চার্ট।</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold bg-white/5 border border-white/5 rounded-full px-3 py-1.5">
                <Clock size={12} className="text-indigo-400" />
                <span>আজকের ব্যবহার: {Math.round((JSON.parse(localStorage.getItem('articulate_screen_time') || '{}')[new Date().toISOString().split('T')[0]] || 0) / 60)} মিনিট</span>
              </div>
            </div>

            {/* Recharts Render Container */}
            <div className="h-[280px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={getLast7DaysData(xpLogs, JSON.parse(localStorage.getItem('articulate_screen_time') || '{}'))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#818cf8" fontSize={10} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#06b6d4" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0b0f19', borderColor: '#1e293b', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                    labelStyle={{ fontWeight: 'black', color: '#818cf8', marginBottom: '4px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" name="XP অর্জিত" dataKey="XP অর্জিত (Progress)" fill="url(#colorXp)" barSize={22} radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" name="স্ক্রিন টাইম (মিনিট)" type="monotone" dataKey="স্ক্রিন টাইম (মিনিট)" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 4 }} activeDot={{ r: 6 }} />
                  
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
                অর্জিত ব্যাজসমূহ (Badges)
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
                <p className="text-slate-500 text-xs italic">কোনো ব্যাজ এখনো আনলক করা হয়নি।</p>
              )}
            </div>

            <div className="card-card p-5 bg-slate-950/40 border border-white/10">
              <h3 className="card-title text-white flex items-center gap-2 mb-4">
                <span>📖</span>
                চ্যাপ্টার প্রগ্রেস (Chapter progress)
              </h3>
              {progress.chapters ? (
                <ul className="space-y-3">
                  {Object.entries(progress.chapters).map(([chapterId, chapter]) => (
                    <li key={chapterId} className="p-3 border border-white/5 rounded-xl bg-white/2">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-bold text-white text-sm">{chapter.chapter_title || `Chapter ${chapterId}`}</div>
                        <div className="text-xs text-indigo-300 font-bold">{chapter.completion_pct ?? 0}% completed</div>
                      </div>
                      {/* Custom premium slider progress bar */}
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-indigo-500 to-cyan-500 h-full transition-all duration-300" style={{ width: `${chapter.completion_pct ?? 0}%` }}></div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-xs italic">কারিকুলাম প্রগ্রেস উপলব্ধ নেই।</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

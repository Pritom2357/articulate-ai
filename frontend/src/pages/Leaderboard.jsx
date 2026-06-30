import { useEffect, useState } from 'react';
import { getLeaderboard } from '../api/progress.js';
import useAuth from '../hooks/useAuth.js';
import { Trophy, Medal, Flame, ShieldAlert, Sparkles, User, Crown } from 'lucide-react';
import maleAvatar from '../assets/articulate_male.jpeg';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';

export default function Leaderboard() {
  const { user } = useAuth();
  const { language } = useThemeLanguage();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const data = await getLeaderboard(100);
        setLeaderboard(data);
      } catch (err) {
        setError(err.message || (language === 'bn' ? 'লিডারবোর্ড লোড করা যায়নি।' : 'Failed to load leaderboard.'));
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [language]);

  if (loading && leaderboard.length === 0) {
    return (
      <div className="page-container text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <div className="text-slate-400 font-semibold font-mono">{language === 'bn' ? 'লিডারবোর্ড লোড হচ্ছে...' : 'Loading leaderboard...'}</div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in max-w-4xl mx-auto">
      <div className="page-header border-b border-white/10 pb-4 mb-8 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="page-title text-white flex justify-center sm:justify-start items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center">
              <Trophy className="text-yellow-400" size={28} />
            </span>
            {language === 'bn' ? 'লিডারবোর্ড (Leaderboard)' : 'Leaderboard'}
          </h1>
          <p className="page-subtitle text-slate-400 mt-2">
            {language === 'bn' 
              ? 'সর্বোচ্চ XP অর্জনকারী শীর্ষ শিক্ষার্থীদের তালিকা। আপনার স্থান কোথায় দেখে নিন!' 
              : 'List of top learners with the highest XP. Find out where you stand!'}
          </p>
        </div>
        <div className="bg-slate-900/60 border border-white/5 rounded-xl px-4 py-2 flex items-center gap-3 shadow-inner">
          <Sparkles className="text-indigo-400" size={16} />
          <span className="text-sm font-bold text-slate-300">Top 100 Learners</span>
        </div>
      </div>

      {error && (
        <div className="glass-alert glass-alert-error mb-6 flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Top 3 Podium */}
      <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-6 mb-12 mt-8">
        {/* Rank 2 (Silver) */}
        {leaderboard[1] && (
          <div className="order-2 md:order-1 flex-1 max-w-[220px] flex flex-col items-center">
            <div className="relative mb-3">
              <div className="absolute -top-3 -left-3 -right-3 -bottom-3 bg-slate-300/10 rounded-full filter blur-md animate-pulse"></div>
              <div className="w-20 h-20 rounded-full border-4 border-slate-300/50 overflow-hidden relative z-10 shadow-[0_0_15px_rgba(203,213,225,0.3)] bg-slate-800 flex items-center justify-center">
                {leaderboard[1].profile_photo ? (
                  <img src={leaderboard[1].profile_photo} alt={leaderboard[1].name} className="w-full h-full object-cover" />
                ) : (
                  <User className="text-slate-500" size={32} />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-slate-200 text-slate-800 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-2 border-slate-800 z-20 shadow-lg">
                2
              </div>
            </div>
            <div className="card-card w-full p-4 bg-gradient-to-t from-slate-800/80 to-slate-900/40 border-t-2 border-slate-400/50 rounded-t-2xl rounded-b-xl text-center">
              <h3 className="font-bold text-white text-sm truncate w-full">{leaderboard[1].name}</h3>
              <p className="text-slate-300 font-black mt-1 text-lg">{leaderboard[1].xp} XP</p>
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold mt-1 uppercase text-slate-500 bg-slate-500/10 py-1 rounded-full px-3 w-max mx-auto">
                <span>Lvl {leaderboard[1].level}</span>
                <span className="mx-1 opacity-50">•</span>
                <span className="flex items-center text-rose-500"><Flame size={10} className="mr-0.5" /> {leaderboard[1].streak_days}</span>
              </div>
            </div>
          </div>
        )}

        {/* Rank 1 (Gold) */}
        {leaderboard[0] && (
          <div className="order-1 md:order-2 flex-1 max-w-[260px] flex flex-col items-center z-10 relative">
            <div className="absolute -top-10 text-yellow-400 animate-bounce">
              <Crown size={40} fill="currentColor" className="drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]" />
            </div>
            <div className="relative mb-3">
              <div className="absolute -top-4 -left-4 -right-4 -bottom-4 bg-yellow-500/20 rounded-full filter blur-lg animate-pulse"></div>
              <div className="w-28 h-28 rounded-full border-4 border-yellow-400 overflow-hidden relative z-10 shadow-[0_0_30px_rgba(250,204,21,0.4)] bg-slate-800 flex items-center justify-center">
                {leaderboard[0].profile_photo ? (
                  <img src={leaderboard[0].profile_photo} alt={leaderboard[0].name} className="w-full h-full object-cover" />
                ) : (
                  <User className="text-slate-500" size={48} />
                )}
              </div>
              <div className="absolute -bottom-3 -right-2 bg-yellow-400 text-yellow-950 w-10 h-10 rounded-full flex items-center justify-center font-black text-lg border-4 border-slate-900 z-20 shadow-lg">
                1
              </div>
            </div>
            <div className="card-card w-full p-5 bg-gradient-to-t from-yellow-900/30 to-slate-900/60 border-t-2 border-yellow-400/80 rounded-t-3xl rounded-b-xl text-center shadow-[0_-10px_30px_rgba(250,204,21,0.1)]">
              <h3 className="font-extrabold text-white text-base truncate w-full">{leaderboard[0].name}</h3>
              <p className="text-yellow-400 font-black mt-1 text-2xl drop-shadow-md">{leaderboard[0].xp} XP</p>
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold mt-2 uppercase bg-yellow-500/20 py-1 rounded-full text-yellow-700 dark:text-yellow-500 w-max mx-auto px-4" style={{ color: 'var(--text-main)', opacity: 0.85 }}>
                <span>Lvl {leaderboard[0].level}</span>
                <span className="mx-1 opacity-50">•</span>
                <span className="flex items-center text-rose-500 font-black"><Flame size={12} className="mr-0.5" /> {leaderboard[0].streak_days}</span>
              </div>
            </div>
          </div>
        )}

        {/* Rank 3 (Bronze) */}
        {leaderboard[2] && (
          <div className="order-3 md:order-3 flex-1 max-w-[220px] flex flex-col items-center">
            <div className="relative mb-3">
              <div className="absolute -top-3 -left-3 -right-3 -bottom-3 bg-amber-700/20 rounded-full filter blur-md animate-pulse"></div>
              <div className="w-20 h-20 rounded-full border-4 border-amber-600/60 overflow-hidden relative z-10 shadow-[0_0_15px_rgba(217,119,6,0.3)] bg-slate-800 flex items-center justify-center">
                {leaderboard[2].profile_photo ? (
                  <img src={leaderboard[2].profile_photo} alt={leaderboard[2].name} className="w-full h-full object-cover" />
                ) : (
                  <User className="text-slate-500" size={32} />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-amber-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-black text-sm border-2 border-slate-800 z-20 shadow-lg">
                3
              </div>
            </div>
            <div className="card-card w-full p-4 bg-gradient-to-t from-amber-900/30 to-slate-900/40 border-t-2 border-amber-600/50 rounded-t-2xl rounded-b-xl text-center">
              <h3 className="font-bold text-white text-sm truncate w-full">{leaderboard[2].name}</h3>
              <p className="text-amber-500 font-black mt-1 text-lg">{leaderboard[2].xp} XP</p>
              <div className="flex items-center justify-center gap-1 text-[10px] font-bold mt-1 uppercase text-slate-500 bg-slate-500/10 py-1 rounded-full px-3 w-max mx-auto">
                <span>Lvl {leaderboard[2].level}</span>
                <span className="mx-1 opacity-50">•</span>
                <span className="flex items-center text-rose-500"><Flame size={10} className="mr-0.5" /> {leaderboard[2].streak_days}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rest of the Leaderboard List */}
      <div className="card-card bg-slate-950/40 border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 bg-slate-900/50 flex text-xs font-bold text-slate-400 uppercase tracking-wider">
          <div className="w-16 text-center">Rank</div>
          <div className="flex-1 pl-4">Learner</div>
          <div className="w-24 text-center hidden sm:block">Level / Streak</div>
          <div className="w-24 text-right">Total XP</div>
        </div>
        
        <ul className="divide-y divide-white/5">
          {leaderboard.slice(3).map((student) => (
            <li 
              key={student.id} 
              className={`px-6 py-4 flex items-center transition duration-200 hover:bg-white/5 ${user?.id === student.id ? 'bg-indigo-500/10 border-l-4 border-l-indigo-500' : ''}`}
            >
              <div className="w-16 text-center font-black text-slate-500 text-lg">
                {student.rank}
              </div>
              <div className="flex-1 flex items-center gap-4 pl-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 flex items-center justify-center border border-white/10">
                  {student.profile_photo ? (
                    <img src={student.profile_photo} alt={student.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-slate-500" size={20} />
                  )}
                </div>
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    {student.name}
                    {user?.id === student.id && (
                      <span className="bg-indigo-500 text-white text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-black">You</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-semibold sm:hidden mt-0.5 flex items-center gap-2">
                    <span className="bg-slate-500/10 px-1.5 py-0.5 rounded">Lvl {student.level}</span>
                    <span className="flex items-center text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded"><Flame size={10} className="mr-0.5" />{student.streak_days}</span>
                  </div>
                </div>
              </div>
              <div className="w-24 justify-center items-center gap-3 hidden sm:flex text-xs font-bold text-slate-500">
                <span className="bg-slate-500/10 px-2 py-1 rounded">Lvl {student.level}</span>
                <span className="flex items-center text-rose-500 bg-rose-500/10 px-2 py-1 rounded"><Flame size={12} className="mr-1" />{student.streak_days}</span>
              </div>
              <div className="w-24 text-right font-black text-indigo-300 text-base">
                {student.xp}
              </div>
            </li>
          ))}
          
          {leaderboard.length === 0 && !loading && (
            <li className="px-6 py-12 text-center text-slate-500 text-sm font-semibold italic">
              {language === 'bn' ? 'কোনো ডেটা পাওয়া যায়নি।' : 'No data found.'}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { getProgress } from '../api/progress.js';

export default function Progress() {
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProgress() {
      try {
        const response = await getProgress();
        setProgress(response.progress || response);
      } catch (err) {
        setError(err.payload?.error || err.message || 'Unable to load progress');
      }
    }

    loadProgress();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Progress</h1>
          <p className="page-subtitle">Track your XP, level, and completion status.</p>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {progress ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card-card">
              <h2 className="card-title">XP</h2>
              <p className="text-3xl font-semibold text-indigo-400">{progress.xp ?? 0}</p>
            </div>
            <div className="card-card">
              <h2 className="card-title">Level</h2>
              <p className="text-3xl font-semibold text-cyan-400">{progress.level ?? 1}</p>
            </div>
            <div className="card-card">
              <h2 className="card-title">Streak</h2>
              <p className="text-3xl font-semibold text-pink-400">{progress.streak_days ?? 0} days</p>
            </div>
          </div>

          {progress.onboarding && (
            <div className="card-card bg-gradient-to-br from-indigo-950/20 via-slate-950/40 to-cyan-950/20 border border-indigo-500/20 relative overflow-hidden p-6 rounded-2xl shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-500/5 rounded-full filter blur-xl pointer-events-none"></div>
              
              <h3 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4 flex items-center gap-2">
                <span>🎙️</span> Onboarding Placement Assessment (প্লেসমেন্ট টেস্টের ফলাফল)
              </h3>
              
              <div className="grid gap-6 md:grid-cols-3 items-center">
                <div className="bg-white/3 border border-white/5 rounded-2xl p-4 text-center">
                  <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Assessed Level</div>
                  <div className="text-4xl font-black text-cyan-400 my-1">{progress.onboarding.assessed_level}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">
                    Placed at Chapter {progress.onboarding.assessed_level === 'B1' ? '3' : progress.onboarding.assessed_level === 'A2' ? '2' : '1'}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-slate-400">Vocabulary Score:</span>
                    <span className="text-indigo-400">{Math.round(progress.onboarding.vocab_score)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${progress.onboarding.vocab_score}%` }}></div>
                  </div>

                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-slate-400">Pronunciation Accuracy:</span>
                    <span className="text-cyan-400">{Math.round(progress.onboarding.pronunciation_score)}%</span>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500 h-full transition-all duration-300" style={{ width: `${progress.onboarding.pronunciation_score}%` }}></div>
                  </div>
                </div>

                <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3.5 rounded-xl border border-white/5 h-full flex flex-col justify-between">
                  <div>
                    <span className="font-bold text-white block mb-1">AI Analyst Notes:</span>
                    <span className="italic">"{progress.onboarding.ai_notes || 'No notes available'}"</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-semibold mt-3">
                    Assessed on: {new Date(progress.onboarding.assessed_at).toLocaleDateString('bn-BD')}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card-card">
              <h3 className="card-title">Badges</h3>
              {progress.badges?.length ? (
                <ul className="space-y-2">
                  {progress.badges.map((badge) => (
                    <li key={badge.badge_id} className={`badge-item p-3 rounded-lg border ${badge.earned ? 'border-indigo-500/30 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/50 opacity-60'}`}>
                      <div className="font-semibold flex items-center gap-2">
                        <span className={badge.earned ? 'text-indigo-300' : 'text-slate-500'}>{badge.title}</span>
                        {badge.earned ? (
                          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full ml-auto">✓ Earned</span>
                        ) : (
                          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full ml-auto">🔒 Locked</span>
                        )}
                      </div>
                      <div className="text-slate-400 text-sm mt-1">{badge.description}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">No badges yet. Keep learning!</p>
              )}
            </div>

            <div className="card-card">
              <h3 className="card-title">Chapter progress</h3>
              {progress.chapters ? (
                <ul className="space-y-2">
                  {Object.entries(progress.chapters).map(([chapterId, chapter]) => (
                    <li key={chapterId}>
                      <div className="font-semibold">{chapter.chapter_title || `Chapter ${chapterId}`}</div>
                      <div className="text-slate-400 text-sm">{chapter.completion_pct ?? 0}% complete</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">No chapter progress available.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="empty-state">Loading progress…</div>
      )}
    </div>
  );
}

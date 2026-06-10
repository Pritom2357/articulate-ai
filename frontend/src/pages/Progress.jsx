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
              <p className="text-3xl font-semibold text-slate-900">{progress.xp ?? 0}</p>
            </div>
            <div className="card-card">
              <h2 className="card-title">Level</h2>
              <p className="text-3xl font-semibold text-slate-900">{progress.level ?? 1}</p>
            </div>
            <div className="card-card">
              <h2 className="card-title">Streak</h2>
              <p className="text-3xl font-semibold text-slate-900">{progress.streak_days ?? 0} days</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card-card">
              <h3 className="card-title">Badges earned</h3>
              {progress.badges?.length ? (
                <ul className="space-y-2">
                  {progress.badges.map((badge) => (
                    <li key={badge.badge_id} className="badge-item">
                      <div className="font-semibold">{badge.title}</div>
                      <div className="text-slate-500 text-sm">{badge.description}</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">No badges yet. Keep learning!</p>
              )}
            </div>

            <div className="card-card">
              <h3 className="card-title">Chapter progress</h3>
              {progress.chapters ? (
                <ul className="space-y-2">
                  {Object.entries(progress.chapters).map(([chapterId, chapter]) => (
                    <li key={chapterId}>
                      <div className="font-semibold">{chapter.chapter_title || `Chapter ${chapterId}`}</div>
                      <div className="text-slate-500 text-sm">{chapter.completion_pct ?? 0}% complete</div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500">No chapter progress available.</p>
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

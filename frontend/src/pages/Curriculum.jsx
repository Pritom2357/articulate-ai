import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getChapters } from '../api/curriculum.js';

export default function Curriculum() {
  const [chapters, setChapters] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchChapters() {
      try {
        const chaptersData = await getChapters();
        setChapters(chaptersData || []);
      } catch (err) {
        setError(err.payload?.error || err.message || 'Could not load chapters');
      }
    }
    fetchChapters();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Curriculum</h1>
          <p className="page-subtitle">Browse chapters and start learning new lessons.</p>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {chapters.length > 0 ? (
          chapters.map((chapter) => (
            <Link
              key={chapter.id}
              to={`/chapters/${chapter.id}`}
              className="card-link"
            >
              <div className="card-card">
                <h2 className="card-title">{chapter.title || `Chapter ${chapter.id}`}</h2>
                <p className="text-sm text-slate-500">{chapter.description || 'View lessons and practice content.'}</p>
              </div>
            </Link>
          ))
        ) : (
          <div className="empty-state">No chapters available yet.</div>
        )}
      </div>
    </div>
  );
}

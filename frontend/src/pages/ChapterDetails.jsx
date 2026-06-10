import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getChapter } from '../api/curriculum.js';

export default function ChapterDetails() {
  const { id } = useParams();
  const [chapter, setChapter] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadChapter() {
      try {
        const result = await getChapter(id);
        setChapter(result.chapter);
        setLessons(result.lessons || []);
      } catch (err) {
        setError(err.payload?.error || err.message || 'Unable to load chapter');
      }
    }

    loadChapter();
  }, [id]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{chapter?.title || `Chapter ${id}`}</h1>
          <p className="page-subtitle">{chapter?.description || 'Explore chapter lessons and vocabulary.'}</p>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="grid gap-4">
        {lessons.map((lesson) => (
          <Link key={lesson.id} to={`/lessons/${lesson.id}`} className="card-link">
            <div className="card-card">
              <h2 className="card-title">{lesson.title || `Lesson ${lesson.id}`}</h2>
              <p className="text-sm text-slate-500">{lesson.summary || lesson.description || 'Start this lesson.'}</p>
            </div>
          </Link>
        ))}
        {lessons.length === 0 && <div className="empty-state">No lessons found for this chapter.</div>}
      </div>
    </div>
  );
}

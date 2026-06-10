import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLesson } from '../api/curriculum.js';
import { markLessonComplete } from '../api/progress.js';

export default function LessonDetails() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [words, setWords] = useState([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadLesson() {
      try {
        const result = await getLesson(id);
        setLesson(result.lesson);
        setWords(result.words || []);
      } catch (err) {
        setError(err.payload?.error || err.message || 'Unable to load lesson');
      }
    }

    loadLesson();
  }, [id]);

  async function handleComplete() {
    try {
      setError('');
      const response = await markLessonComplete({ lessonId: id, score: 100 });
      setStatus(response?.message || 'Lesson marked complete');
    } catch (err) {
      setStatus('');
      setError(err.payload?.error || err.message || 'Could not update progress');
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{lesson?.title || `Lesson ${id}`}</h1>
          <p className="page-subtitle">{lesson?.description || 'Review the content and complete the lesson.'}</p>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="space-y-6">
        {lesson?.objective_bn && <div className="prose max-w-none">{lesson.objective_bn}</div>}
        <button className="form-button" type="button" onClick={handleComplete}>Mark lesson complete</button>
        {status && <div className="alert alert-success">{status}</div>}
        <div className="card-card">
          <h2 className="card-title">Vocabulary</h2>
          {words.length > 0 ? (
            <ul className="space-y-2">
              {words.map((word) => (
                <li key={word.id} className="word-item">
                  <Link to={`/words/${word.id}`} className="font-semibold link">{word.word || `Word ${word.id}`}</Link>
                  <div className="text-slate-500">{word.bangla_meaning || word.definition || word.meaning || ''}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500">No vocabulary found for this lesson.</p>
          )}
        </div>
      </div>
    </div>
  );
}

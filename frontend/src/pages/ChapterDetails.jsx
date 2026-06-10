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
            <div className="card-card hover:border-indigo-500/50 hover:shadow-md transition">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="card-title text-indigo-900">{lesson.title || `Lesson ${lesson.id}`}</h2>
                  <p className="text-sm text-slate-500">{lesson.summary || lesson.objective_bn || 'Start this lesson.'}</p>
                </div>
                <span className="text-indigo-500 text-sm font-semibold">Start Lesson 📖</span>
              </div>
            </div>
          </Link>
        ))}

        {lessons.length > 0 && (
          <div className="border-t border-dashed border-slate-200 pt-6 mt-2">
            <h3 className="font-bold text-slate-700 text-sm mb-3">🎓 Chapter Final speaking Evaluation</h3>
            <Link to={`/chapters/${id}/conversation`} className="card-link">
              <div className="card-card bg-indigo-900 text-white hover:bg-indigo-950 transition-all duration-300 border-none shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">🎙️</div>
                    <div>
                      <h2 className="text-lg font-extrabold text-cyan-300">Start IELTS Open Conversation</h2>
                      <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
                        চ্যাপ্টারের পড়া শেষে আপনার গাইড টিউটরের সাথে IELTS স্টাইলের কথোপকথন পরীক্ষা দিন এবং আপনার আরএজি (RAG) স্টাডি প্ল্যান নিন।
                      </p>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-white font-bold rounded-lg border-none cursor-pointer text-xs shadow-md transition">
                    Start Test (পরীক্ষা দিন) ▶
                  </button>
                </div>
              </div>
            </Link>
          </div>
        )}

        {lessons.length === 0 && <div className="empty-state">No lessons found for this chapter.</div>}
      </div>
    </div>
  );
}

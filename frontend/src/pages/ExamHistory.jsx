import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { History, ArrowLeft, Award, CheckCircle, XCircle, Headphones, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { getExamHistory, getExamResults, getAnswerAudioBlobUrl } from '../api/exam.js';

// ─── Audio player that fetches from authenticated endpoint ────────────────────
function AuthAudioPlayer({ answerId }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let url = null;
    getAnswerAudioBlobUrl(answerId)
      .then(s => { url = s; setSrc(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => { if (url) URL.revokeObjectURL(url); };
  }, [answerId]);
  if (loading) return <Loader2 size={14} className="animate-spin text-slate-400" />;
  if (!src) return <span className="text-xs text-slate-500 italic">No audio</span>;
  return <audio controls src={src} className="h-8 w-full max-w-[220px]" />;
}

// ─── Expanded answer script for one exam ─────────────────────────────────────
function AnswerScript({ examId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getExamResults(examId)
      .then(res => {
        if (res?.success && res?.data) setData(res.data);
        else setError(res?.message || 'Could not load result.');
      })
      .catch(() => setError('Failed to load result.'))
      .finally(() => setLoading(false));
  }, [examId]);

  if (loading) return (
    <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
      <Loader2 size={14} className="animate-spin" /> Loading answer script...
    </div>
  );
  if (error) return <div className="text-red-400 text-sm py-4">{error}</div>;
  if (!data) return null;

  const { exam, questions = [], answers = [] } = data;

  // If exam is not yet evaluated, show status
  if (!['EVALUATED'].includes(exam.status)) {
    return (
      <div className="text-slate-400 text-sm py-3 italic">
        Exam status: <span className="font-semibold text-white capitalize">{exam.status?.toLowerCase()}</span>
        {(exam.status === 'SUBMITTED' || exam.status === 'EVALUATING') && ' — evaluation in progress.'}
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-3">
      {/* Score summary */}
      <div className="flex gap-3 flex-wrap mb-4">
        <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl px-4 py-2 text-center min-w-[100px]">
          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Score</div>
          <div className="text-2xl font-black text-indigo-400">{Math.round(exam.score_pct ?? 0)}%</div>
          <div className="text-xs text-slate-500">{exam.obtained_marks} / {exam.total_marks} marks</div>
        </div>
        {exam.listening_score != null && (
          <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Listening</div>
            <div className="text-2xl font-black text-blue-400">{Math.round(exam.listening_score ?? 0)}</div>
          </div>
        )}
        {exam.speaking_score != null && (
          <div className="bg-rose-950/30 border border-rose-500/20 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Speaking</div>
            <div className="text-2xl font-black text-rose-400">{Math.round(exam.speaking_score ?? 0)}</div>
          </div>
        )}
        {exam.awards_xp && (
          <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">XP</div>
            <div className="text-2xl font-black text-emerald-400">+{Math.round((exam.score_pct ?? 0) * 0.5) + 20}</div>
          </div>
        )}
      </div>

      {exam.feedback_bn && (
        <p className="text-sm text-slate-400 italic border-l-2 border-indigo-500/40 pl-3 mb-4">{exam.feedback_bn}</p>
      )}

      {/* Per-question breakdown */}
      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Answer Script</h4>
      {questions.map((q, idx) => {
        const a = answers.find(ans => ans.question_id === q.id);
        const correct = a?.is_correct;
        return (
          <div key={q.id} className={`p-4 rounded-xl border transition ${correct ? 'border-green-500/20 bg-green-950/10' : 'border-red-500/20 bg-red-950/10'}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-slate-400 bg-black/30 px-2 py-0.5 rounded">{q.section}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-black/20 px-2 py-0.5 rounded">{q.item_type}</span>
                  <span className="text-sm font-semibold text-white">Q{idx + 1}: "{q.text_en}"</span>
                </div>
                {q.text_bn && <div className="text-xs text-slate-400 mb-2">{q.text_bn}</div>}

                {/* Listening: original audio + typed answer */}
                {q.section === 'LISTENING' && (
                  <div className="space-y-2">
                    {q.audio_url && (
                      <div>
                        <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-semibold flex items-center gap-1">
                          <Headphones size={10} /> Original Audio
                        </div>
                        <audio controls src={q.audio_url} className="h-8 w-full max-w-[220px]" />
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-semibold">Your Answer</div>
                      <span className={`text-sm font-medium ${correct ? 'text-green-300' : 'text-red-300'}`}>
                        "{a?.typed_answer || <em className="text-slate-500">Not answered</em>}"
                      </span>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-semibold">Correct Answer</div>
                      <span className="text-sm font-medium text-slate-300">"{q.text_en}"</span>
                    </div>
                  </div>
                )}

                {/* Speaking: audio recording */}
                {q.section === 'SPEAKING' && (
                  <div className="space-y-2">
                    <div>
                      <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-semibold">Your Recording</div>
                      {a ? <AuthAudioPlayer answerId={a.id} /> : <span className="text-xs text-slate-500 italic">Not recorded</span>}
                    </div>
                    {a?.accuracy_score != null && (
                      <div className="text-xs text-slate-400">
                        Pronunciation accuracy: <span className="text-white font-semibold">{Math.round(a.accuracy_score)}%</span>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Feedback */}
                {a?.feedback && (
                  <div className="mt-2 text-xs bg-black/20 p-2 rounded-lg border border-white/5">
                    <span className="font-semibold text-slate-300">AI Feedback: </span>
                    <span className="text-white">{a.feedback}</span>
                  </div>
                )}
              </div>

              {/* Marks badge */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1">
                  {correct ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}
                  <span className={`text-sm font-bold ${correct ? 'text-green-400' : 'text-red-400'}`}>
                    {a?.marks_awarded ?? 0} / {q.marks}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ExamHistory page ────────────────────────────────────────────────────
export default function ExamHistory() {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const TYPE_COLORS = {
    LESSON:   'text-violet-400 bg-violet-950/40 border-violet-500/20',
    CHAPTER:  'text-amber-400 bg-amber-950/40 border-amber-500/20',
    IELTS:    'text-cyan-400 bg-cyan-950/40 border-cyan-500/20',
    PROGRESS: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/20',
    PRACTICE: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20',
  };

  useEffect(() => {
    getExamHistory()
      .then(data => setHistory(Array.isArray(data?.data) ? data.data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id) => setExpandedId(prev => prev === id ? null : id);

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <div className="page-header border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/tests')} className="text-slate-400 hover:text-white transition">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title text-indigo-400 flex items-center gap-2">
              <History size={22} /> Exam History
            </h1>
            <p className="page-subtitle text-slate-400">Full answer scripts for all your past exams.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 size={16} className="animate-spin" /> Loading your exam history...
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <History size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-lg font-semibold">No exams yet</p>
          <p className="text-sm mt-1">Start an exam from the Tests page.</p>
          <button onClick={() => navigate('/tests')} className="mt-4 primary-button" style={{ width: 'auto' }}>
            Go to Tests
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(h => {
            const isExpanded = expandedId === h.id;
            const colorClass = TYPE_COLORS[h.exam_type] || 'text-slate-400 bg-slate-800/40 border-slate-700/30';
            return (
              <div key={h.id} className="card-card border border-white/5 overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => toggle(h.id)}
                  className="w-full p-4 flex items-center justify-between gap-3 hover:bg-white/5 transition text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${colorClass}`}>
                      {h.exam_type}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">{h.title}</div>
                      <div className="text-xs text-slate-500">{new Date(h.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {h.status === 'EVALUATED' ? (
                      <div className="text-right">
                        <div className="text-sm font-black text-indigo-400">{Math.round(h.score_pct ?? 0)}%</div>
                        <div className="text-[10px] text-slate-500">{h.obtained_marks}/{h.total_marks} marks</div>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500 capitalize">{h.status?.toLowerCase()}</span>
                    )}
                    {isExpanded
                      ? <ChevronUp size={16} className="text-slate-400" />
                      : <ChevronDown size={16} className="text-slate-400" />
                    }
                  </div>
                </button>

                {/* Expandable answer script */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/5">
                    <AnswerScript examId={h.id} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

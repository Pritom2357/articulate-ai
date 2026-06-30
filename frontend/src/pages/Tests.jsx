import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Play, ArrowLeft, Mic, Award, CheckCircle, XCircle, Headphones, Loader2, BookOpen, Layers, History, ChevronRight } from 'lucide-react';
import { generateExam, submitExamAnswers, getExamResults, getAnswerAudioBlobUrl, getExamHistory } from '../api/exam.js';
import { getChapters, getLessonsByChapter } from '../api/curriculum.js';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';

const AuthAudioPlayer = ({ answerId }) => {
  const [audioSrc, setAudioSrc] = useState(null);
  useEffect(() => {
    let url = null;
    getAnswerAudioBlobUrl(answerId)
      .then(src => {
        url = src;
        setAudioSrc(src);
      })
      .catch(console.error);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [answerId]);
  
  if (!audioSrc) return <Loader2 size={14} className="animate-spin text-slate-400" />;
  return <audio controls src={audioSrc} className="h-8 w-full max-w-[200px]" />;
};

export default function Tests() {
  const navigate = useNavigate();
  const { language } = useThemeLanguage();
  
  // STATES
  const [view, setView] = useState('HUB'); // 'HUB' | 'PICKER' | 'ACTIVE' | 'EVALUATING' | 'RESULT'
  const [loadingType, setLoadingType] = useState(null);
  const [error, setError] = useState('');
  
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  
  // Recording
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Listening Audio
  const [playCount, setPlayCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [typedAnswer, setTypedAnswer] = useState('');
  const audioRef = useRef(new Audio());
  
  // Polling / Results
  const pollIntervalRef = useRef(null);
  const [results, setResults] = useState(null);

  // Lesson / Chapter picker
  const [pickerType, setPickerType] = useState(null); // 'LESSON' | 'CHAPTER'
  const [chapters, setChapters] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [pickerLoading, setPickerLoading] = useState(false);

  // Exam history
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Reset audio when question changes
  useEffect(() => {
    if (view === 'ACTIVE' && questions.length > 0) {
      const q = questions[currentQuestionIndex];
      setPlayCount(0);
      setIsPlaying(false);
      setTypedAnswer(answers[q.id]?.typedAnswer || '');
      if (q.section === 'LISTENING' && q.audio_url) {
        audioRef.current.src = q.audio_url;
      } else {
        audioRef.current.src = '';
      }
    }
  }, [currentQuestionIndex, view, questions]);

  // Clean up polling and recording
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
      audioRef.current.pause();
    };
  }, []);

  // Fetch exam history on mount
  useEffect(() => {
    setHistoryLoading(true);
    getExamHistory().then(data => {
      setHistory(Array.isArray(data?.data) ? data.data : []);
    }).catch(() => {}).finally(() => setHistoryLoading(false));
  }, []);

  const handleStartExam = async (examType, extraParams = {}) => {
    try {
      setLoadingType(examType);
      setError('');
      const data = await generateExam({ examType, ...extraParams });
      if (data.success && data.exam && data.questions) {
        setExam(data.exam);
        setQuestions(data.questions);
        setAnswers({});
        setCurrentQuestionIndex(0);
        setView('ACTIVE');
        setSelectedChapter(null);
        setLessons([]);
      } else {
        setError(data.message || 'Failed to generate exam.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || err.error || 'Failed to start exam.');
    } finally {
      setLoadingType(null);
    }
  };

  const openPicker = async (type) => {
    setPickerType(type);
    setView('PICKER');
    setSelectedChapter(null);
    setLessons([]);
    setError('');
    setPickerLoading(true);
    try {
      const chaps = await getChapters();
      setChapters(chaps || []);
    } catch (e) {
      setError('Failed to load chapters.');
    } finally {
      setPickerLoading(false);
    }
  };

  const selectChapterInPicker = async (chapter) => {
    setSelectedChapter(chapter);
    if (pickerType === 'LESSON') {
      setPickerLoading(true);
      try {
        const lsns = await getLessonsByChapter(chapter.id);
        setLessons(lsns || []);
      } catch (e) {
        setError('Failed to load lessons.');
      } finally {
        setPickerLoading(false);
      }
    }
  };

  // --- AUDIO LISTENING ---
  const handlePlayAudio = () => {
    if (playCount >= 3 || isPlaying) return;
    setIsPlaying(true);
    audioRef.current.play().catch(e => {
      console.error('Audio play error:', e);
      setIsPlaying(false);
    });
    audioRef.current.onended = () => {
      setIsPlaying(false);
      setPlayCount(prev => prev + 1);
    };
  };

  // --- AUDIO RECORDING (SPEAKING) ---
  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const qId = questions[currentQuestionIndex].id;
        setAnswers(prev => ({
          ...prev,
          [qId]: { ...prev[qId], audioBlob: blob }
        }));
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error(err);
      setError('Could not access microphone.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // --- NAVIGATION ---
  const handleNext = () => {
    const qId = questions[currentQuestionIndex].id;
    if (questions[currentQuestionIndex].section === 'LISTENING') {
       // Save typed answer
       setAnswers(prev => ({
         ...prev,
         [qId]: { ...prev[qId], typedAnswer }
       }));
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      submitExam();
    }
  };

  // --- SUBMISSION ---
  const submitExam = async () => {
    try {
      setView('EVALUATING');
      
      // Prepare form data
      const formData = new FormData();
      const answersList = [];
      
      // Add answers JSON string and audio blobs
      questions.forEach(q => {
        const ans = answers[q.id];
        if (!ans) return;
        
        if (q.section === 'LISTENING' && ans.typedAnswer) {
          answersList.push({ question_id: q.id, typed_answer: ans.typedAnswer });
        } else if (q.section === 'SPEAKING' && ans.audioBlob) {
          answersList.push({ question_id: q.id });
          formData.append(`audio_${q.id}`, ans.audioBlob, `q_${q.id}.wav`);
        }
      });
      
      formData.append('answers', JSON.stringify(answersList));
      
      await submitExamAnswers(exam.id, formData);
      startPollingResults();
      
    } catch (err) {
      console.error(err);
      setError('Submission failed.');
      setView('ACTIVE');
    }
  };

  const startPollingResults = () => {
    pollIntervalRef.current = setInterval(async () => {
      try {
        // Results endpoint returns { success, data: { exam, questions, answers } }
        // or { success, status, message } while still evaluating
        const res = await getExamResults(exam.id);
        const examStatus = res.data?.exam?.status || res.status;
        if (res.success && examStatus === 'EVALUATED') {
          clearInterval(pollIntervalRef.current);
          // Flatten data into results so result view can destructure it directly
          setResults(res.data);
          setView('RESULT');
        } else if (res.success && examStatus === 'FAILED') {
          clearInterval(pollIntervalRef.current);
          setError('Exam evaluation failed. Please try again.');
          setView('HUB');
        }
        // Otherwise keep polling (SUBMITTED / EVALUATING)
      } catch (e) {
        console.error('Polling error', e);
      }
    }, 2500); // Poll every 2.5 seconds
  };

  // --- RENDERERS ---
  
  if (view === 'HUB') {
    return (
      <div className="page-container" style={{ maxWidth: '800px' }}>
        <div className="page-header border-b border-white/10 pb-4 mb-6">
          <div>
            <h1 className="page-title text-indigo-400 flex items-center gap-2">
              <ClipboardList /> Dynamic Exams
            </h1>
            <p className="page-subtitle text-slate-400">
              {language === 'bn' 
                ? 'আপনার দক্ষতা যাচাই করতে একটি এআই-জেনারেটেড পরীক্ষায় অংশ নিন।' 
                : 'Take an AI-generated exam to test your listening and speaking skills.'}
            </p>
          </div>
        </div>

        {error && <div className="glass-alert glass-alert-error mb-4">{error}</div>}

        <div className="grid gap-4 grid-cols-1 md:grid-cols-6">
          {/* Progress Exam */}
          <div className="md:col-span-3 card-card p-5 border border-indigo-500/20 hover:border-indigo-500/60 transition bg-indigo-950/20 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Progress Exam</h3>
              <p className="text-sm text-slate-400 mb-4">Based on your weak words and recent progress. Awards XP.</p>
            </div>
            <button onClick={() => handleStartExam('PROGRESS')} disabled={loadingType !== null} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2">
              {loadingType === 'PROGRESS' ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />} Start Exam
            </button>
          </div>

          {/* IELTS Mock */}
          <div className="md:col-span-3 card-card p-5 bg-slate-900/50 border border-white/5 flex flex-col items-start text-left hover:bg-slate-800/50 transition relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <h3 className="font-bold text-white text-lg mb-2 z-10">IELTS Mock</h3>
            <p className="text-slate-400 text-sm mb-6 flex-1 z-10">Band 4-6 style everyday topics. High XP reward.</p>
            <button onClick={() => handleStartExam('IELTS')} disabled={!!loadingType} className="w-full bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold py-3 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 z-10">
              {loadingType === 'IELTS' ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />} Start IELTS
            </button>
          </div>

          {/* Lesson Exam */}
          <div className="md:col-span-2 card-card p-5 border border-violet-500/20 hover:border-violet-500/60 transition bg-violet-950/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2"><BookOpen size={16} className="text-violet-400" /><h3 className="text-lg font-bold text-white">Lesson Exam</h3></div>
              <p className="text-sm text-slate-400 mb-4">Test a specific lesson's words & phrases. Awards XP.</p>
            </div>
            <button onClick={() => openPicker('LESSON')} disabled={!!loadingType} className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2">
              <BookOpen size={16} /> Select Lesson
            </button>
          </div>

          {/* Chapter Exam */}
          <div className="md:col-span-2 card-card p-5 border border-amber-500/20 hover:border-amber-500/60 transition bg-amber-950/20 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2"><Layers size={16} className="text-amber-400" /><h3 className="text-lg font-bold text-white">Chapter Exam</h3></div>
              <p className="text-sm text-slate-400 mb-4">Test an entire chapter across all its lessons. Awards XP.</p>
            </div>
            <button onClick={() => openPicker('CHAPTER')} disabled={!!loadingType} className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2">
              <Layers size={16} /> Select Chapter
            </button>
          </div>

          {/* Practice Exam */}
          <div className="md:col-span-2 card-card p-5 border border-emerald-500/20 hover:border-emerald-500/60 transition bg-emerald-950/20 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Practice Exam</h3>
              <p className="text-sm text-slate-400 mb-4">Casual practice to keep your streak alive. No XP awarded.</p>
            </div>
            <button onClick={() => handleStartExam('PRACTICE')} disabled={loadingType !== null} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2">
              {loadingType === 'PRACTICE' ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />} Start Practice
            </button>
          </div>
        </div>

        {/* Exam History */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2"><History size={16} className="text-slate-400" /> Recent Exams</h2>
            <button
              onClick={() => navigate('/exam-history')}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition font-semibold"
            >
              View Full History →
            </button>
          </div>
          {historyLoading ? (
            <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin" /> Loading history...</div>
          ) : history.length === 0 ? (
            <p className="text-slate-500 text-sm">No exams taken yet.</p>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 5).map(h => (
                <div
                  key={h.id}
                  onClick={() => navigate('/exam-history')}
                  className="card-card p-3 flex items-center justify-between border border-white/5 hover:bg-white/5 transition cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">{h.title}</div>
                    <div className="text-xs text-slate-400">{h.exam_type} • {new Date(h.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {h.status === 'EVALUATED' ? (
                      <span className="text-sm font-bold text-emerald-400">{Math.round(h.score_pct ?? 0)}%</span>
                    ) : (
                      <span className="text-xs text-slate-500 capitalize">{h.status?.toLowerCase()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    );
  }

  // --- PICKER VIEW (Lesson / Chapter selection) ---
  if (view === 'PICKER') {
    return (
      <div className="page-container" style={{ maxWidth: '800px' }}>
        <div className="page-header border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => { setView('HUB'); setError(''); }} className="text-slate-400 hover:text-white transition"><ArrowLeft size={20} /></button>
            <h1 className="page-title text-indigo-400">{pickerType === 'LESSON' ? 'Select a Lesson' : 'Select a Chapter'}</h1>
          </div>
        </div>
        {error && <div className="glass-alert glass-alert-error mb-4">{error}</div>}
        {pickerLoading ? (
          <div className="flex items-center gap-2 text-slate-400"><Loader2 className="animate-spin" size={16} /> Loading...</div>
        ) : (
          <div className="space-y-3">
            {/* Chapter list */}
            {chapters.map(ch => (
              <div key={ch.id}>
                <button
                  onClick={() => {
                    if (pickerType === 'CHAPTER') {
                      handleStartExam('CHAPTER', { chapterId: ch.id });
                    } else {
                      selectChapterInPicker(ch);
                    }
                  }}
                  disabled={!!loadingType}
                  className="w-full card-card p-4 flex items-center justify-between border border-white/5 hover:bg-white/5 transition text-left"
                >
                  <div>
                    <div className="font-semibold text-white text-sm">{ch.title || ch.title_en || `Chapter ${ch.id}`}</div>
                    {ch.title_bn && <div className="text-xs text-slate-400">{ch.title_bn}</div>}
                  </div>
                  {loadingType === 'CHAPTER' && pickerType === 'CHAPTER' ? (
                    <Loader2 size={16} className="animate-spin text-slate-400" />
                  ) : (
                    <ChevronRight size={16} className="text-slate-400" />
                  )}
                </button>
                {/* Lesson list under selected chapter */}
                {pickerType === 'LESSON' && selectedChapter?.id === ch.id && (
                  <div className="ml-4 mt-2 space-y-2">
                    {pickerLoading ? (
                      <div className="flex items-center gap-2 text-slate-400 text-sm"><Loader2 size={14} className="animate-spin" /> Loading lessons...</div>
                    ) : lessons.map(ls => (
                      <button
                        key={ls.id}
                        onClick={() => handleStartExam('LESSON', { lessonId: ls.id })}
                        disabled={!!loadingType}
                        className="w-full card-card p-3 flex items-center justify-between border border-violet-500/20 hover:bg-violet-950/30 transition text-left"
                      >
                        <div>
                          <div className="font-semibold text-white text-sm">{ls.title || ls.title_en || `Lesson ${ls.id}`}</div>
                          {ls.title_bn && <div className="text-xs text-slate-400">{ls.title_bn}</div>}
                        </div>
                        {loadingType === 'LESSON' ? <Loader2 size={14} className="animate-spin text-slate-400" /> : <Play size={14} className="text-violet-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (view === 'ACTIVE' && exam && questions.length > 0) {
    const q = questions[currentQuestionIndex];
    return (
      <div className="page-container" style={{ maxWidth: '800px' }}>
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-white">{exam.title}</h1>
              <p className="text-xs text-slate-400">Question {currentQuestionIndex + 1} of {questions.length} • {q.section}</p>
            </div>
          </div>

          <div className="card-card p-6 text-center bg-slate-950/20 border border-white/10 shadow-xl min-h-[300px] flex flex-col justify-center">
            
            {q.section === 'LISTENING' && (
              <div className="space-y-6 max-w-md mx-auto w-full">
                 <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Listen and Type</div>
                 
                 <button 
                   onClick={handlePlayAudio}
                   disabled={playCount >= 3 || isPlaying}
                   className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                     playCount >= 3 ? 'bg-slate-800 text-slate-500 cursor-not-allowed' :
                     isPlaying ? 'bg-indigo-400 text-white scale-110 animate-pulse' :
                     'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                   }`}
                 >
                   {isPlaying ? <Loader2 className="animate-spin" size={32}/> : <Headphones size={32} />}
                 </button>
                 
                 <div className="text-xs text-slate-400">Plays remaining: {3 - playCount}</div>
                 
                 <input 
                   type="text" 
                   value={typedAnswer}
                   onChange={e => setTypedAnswer(e.target.value)}
                   className="glass-input w-full text-center text-lg mt-4" 
                   placeholder="Type what you hear..." 
                   autoFocus
                 />
              </div>
            )}
            
            {q.section === 'SPEAKING' && (
              <div className="space-y-6">
                <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">Read and Pronounce</div>
                
                <h2 className="text-3xl font-black text-white leading-relaxed mb-1">
                  "{q.text_en}"
                </h2>
                <p className="text-sm text-indigo-300 font-semibold mb-8">
                  {language === 'bn' ? 'অর্থ:' : 'Meaning:'} {q.text_bn}
                </p>

                <div className="flex flex-col items-center justify-center py-4 space-y-4">
                  <button
                    onMouseDown={startRecording}
                    onMouseUp={stopRecording}
                    onTouchStart={startRecording}
                    onTouchEnd={stopRecording}
                    className={`w-20 h-20 rounded-full border-none flex items-center justify-center cursor-pointer transition-all duration-300 shadow-lg ${
                      recording
                        ? 'bg-red-500 scale-110 animate-[pulse_0.5s_ease-in-out_infinite]'
                        : 'bg-rose-600 hover:bg-rose-500 text-white'
                    }`}
                  >
                    <Mic size={32} />
                  </button>
                  <div className="text-xs text-slate-400 font-semibold">
                    {recording ? 'Recording... Release to stop' : 'Hold mic button and read the sentence'}
                  </div>
                  {answers[q.id]?.audioBlob && !recording && (
                    <div className="text-xs text-green-400 font-bold bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                      Audio recorded successfully ✓
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-8 pt-4 border-t border-white/5 flex justify-end">
               <button
                  onClick={handleNext}
                  className="glass-button bg-indigo-600 hover:bg-indigo-500 text-white border-none font-bold px-8"
                  disabled={
                    (q.section === 'LISTENING' && !typedAnswer.trim()) ||
                    (q.section === 'SPEAKING' && !answers[q.id]?.audioBlob)
                  }
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Submit Exam'}
                </button>
            </div>
            
          </div>
        </div>
      </div>
    );
  }

  if (view === 'EVALUATING') {
    return (
      <div className="page-container text-center py-20 animate-fade-in flex flex-col items-center justify-center min-h-[60vh]">
        <div className="relative">
          <div className="w-32 h-32 border-4 border-indigo-500/20 rounded-full animate-[spin_3s_linear_infinite]"></div>
          <div className="w-32 h-32 border-4 border-transparent border-t-indigo-500 rounded-full animate-spin absolute top-0 left-0"></div>
          <Loader2 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" size={40} />
        </div>
        <h2 className="text-2xl font-black text-white mt-8 mb-2">Evaluating your performance...</h2>
        <p className="text-slate-400 max-w-sm mx-auto">
          AI is analyzing your pronunciation and listening accuracy. This usually takes 5-10 seconds.
        </p>
      </div>
    );
  }

  if (view === 'RESULT' && results) {
    const { exam: resExam, questions: resQuestions, answers: resAnswers } = results;
    
    return (
      <div className="page-container space-y-6 text-center animate-fade-in py-6" style={{ maxWidth: '800px' }}>
        <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto border border-indigo-500/30">
          <Award className="text-indigo-400" size={40} />
        </div>
        
        <div>
          <h1 className="text-3xl font-black text-white">{resExam.title} Completed!</h1>
          <p className="text-slate-400 mt-2 max-w-md mx-auto italic text-sm">
            {resExam.feedback_bn}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto my-8">
          <div className="card-card p-5 bg-indigo-950/20 border border-indigo-500/20">
            <div className="text-slate-400 text-xs uppercase font-bold tracking-widest">Score</div>
            <div className="text-4xl font-black text-indigo-400 mt-2">{Math.round(resExam.score_pct)}%</div>
            <div className="text-xs text-slate-500 mt-1">{resExam.obtained_marks} / {resExam.total_marks} Marks</div>
          </div>
          <div className="card-card p-5 bg-emerald-950/20 border border-emerald-500/20">
            <div className="text-slate-400 text-xs uppercase font-bold tracking-widest">XP Reward</div>
            <div className="text-4xl font-black text-emerald-400 mt-2">
              {resExam.awards_xp ? `+${Math.round(resExam.score_pct * 0.5) + 20} XP` : '0 XP'}
            </div>
            <div className="text-xs text-slate-500 mt-1">{resExam.awards_xp ? 'XP Added!' : 'Practice Mode'}</div>
          </div>
        </div>

        <div className="card-card mx-auto p-5 text-left border border-white/10 bg-slate-950/30">
          <h3 className="font-bold text-white text-sm border-b border-white/5 pb-3 mb-3">Question Breakdown</h3>
          <div className="space-y-4">
            {resQuestions.map((q) => {
              const a = resAnswers.find(ans => ans.question_id === q.id);
              
              return (
                <div key={q.id} className="p-3 bg-white/5 rounded-xl border border-white/5 flex justify-between items-start gap-4 hover:bg-white/10 transition">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-black/30 px-2 py-0.5 rounded">{q.section}</span>
                      <span className="text-sm text-white font-semibold">"{q.text_en}"</span>
                    </div>
                    {q.section === 'LISTENING' && q.audio_url && (
                      <div className="mb-2">
                        <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-semibold">Original Audio:</div>
                        <audio controls src={q.audio_url} className="h-8 w-full max-w-[200px]" />
                      </div>
                    )}
                    {a ? (
                      <>
                        {q.section === 'SPEAKING' && (
                          <div className="mb-2">
                            <div className="text-[10px] text-slate-400 mb-1 uppercase tracking-wider font-semibold">Your Recording:</div>
                            <AuthAudioPlayer answerId={a.id} />
                          </div>
                        )}
                        {q.section === 'LISTENING' && (
                          <div className="text-xs text-slate-400 mt-1">
                            You typed: <span className="text-white font-medium">"{a.typed_answer}"</span>
                          </div>
                        )}
                        {a.feedback && (
                          <div className="text-xs text-slate-400 mt-2 bg-black/20 p-2 rounded-lg border border-white/5">
                            <span className="font-semibold text-slate-300">AI Feedback:</span> <span className="text-white">{a.feedback}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-xs text-red-400 mt-1 italic">
                        Not answered
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 font-bold text-sm min-w-[60px] text-right">
                    <div className="flex items-center gap-1.5">
                      {a?.is_correct ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}
                      <span className={a?.is_correct ? 'text-green-400' : 'text-red-400'}>
                        {a?.marks_awarded || 0} / {q.marks}
                      </span>
                    </div>
                    {q.section === 'SPEAKING' && a?.accuracy_score !== undefined && a?.accuracy_score !== null && (
                      <div className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                        Acc: {Math.round(a.accuracy_score)}%
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex gap-4 justify-center mt-8 pb-10">
          <button
            onClick={() => {
              setView('HUB');
              setResults(null);
            }}
            className="glass-button"
            style={{ width: 'auto' }}
          >
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  return null;
}

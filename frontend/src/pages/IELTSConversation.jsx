import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getChapter } from '../api/curriculum.js';
import { startConversationSession, submitConversationTurn, endConversationSession } from '../api/conversation.js';
import useAuth from '../hooks/useAuth.js';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';
import { Mic, MicOff, Volume2, Loader2, ChevronLeft, BarChart2, Star, AlertCircle, CheckCircle2, BookOpen, Lightbulb, MessageSquare, Play, Pause } from 'lucide-react';

import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articulate_female.jpeg';

// ---------- helpers ----------

function scoreColor(score) {
  if (score == null) return 'text-slate-400';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
}

function scoreBg(score) {
  if (score == null) return 'bg-slate-700/60 border-slate-600/40';
  if (score >= 80) return 'bg-emerald-900/40 border-emerald-500/30';
  if (score >= 60) return 'bg-yellow-900/40 border-yellow-500/30';
  return 'bg-red-900/40 border-red-500/30';
}

function bandColor(band) {
  if (band >= 7) return 'text-emerald-400';
  if (band >= 5.5) return 'text-yellow-400';
  return 'text-red-400';
}

function PronScoreBadge({ pronScore, fluencyScore }) {
  if (pronScore == null && fluencyScore == null) return null;
  return (
    <div className="flex gap-1.5 mt-1.5 flex-wrap">
      {pronScore != null && (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${scoreBg(pronScore)} ${scoreColor(pronScore)}`}>
          Pron {pronScore}
        </span>
      )}
      {fluencyScore != null && (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${scoreBg(fluencyScore)} ${scoreColor(fluencyScore)}`}>
          Fluency {fluencyScore}
        </span>
      )}
    </div>
  );
}

function WordBreakdown({ words }) {
  if (!words || words.length === 0) return null;
  const weak = words.filter(w => w.accuracy_score < 70);
  if (weak.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {weak.map((w, i) => (
        <span key={i} className="px-1.5 py-0.5 bg-red-900/30 border border-red-500/20 rounded text-[10px] text-red-300">
          {w.word} <span className="text-red-400/60">{w.accuracy_score}</span>
        </span>
      ))}
    </div>
  );
}

// ---------- audio player for recordings ----------

function AudioPlayer({ src }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
    setPlaying(p => !p);
  };

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => { setPlaying(false); setProgress(0); }}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (el && el.duration) setProgress(el.currentTime / el.duration);
        }}
      />
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-900/40 hover:bg-indigo-900/60 border border-indigo-500/25 rounded-lg text-indigo-300 text-[10px] font-semibold transition-colors"
      >
        {playing ? <Pause size={10} /> : <Play size={10} />}
        {playing ? 'Pause' : 'Play recording'}
      </button>
      <div className="grow h-1 bg-slate-700 rounded-full overflow-hidden max-w-30">
        <div className="h-full bg-indigo-400 transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

// ---------- score circle for report ----------

function ScoreCircle({ label, value, max = 100 }) {
  const pct = value != null ? Math.min(value / max, 1) : 0;
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = value >= 80 ? '#34d399' : value >= 60 ? '#fbbf24' : '#f87171';
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#334155" strokeWidth="5" />
        <circle
          cx="36" cy="36" r={r} fill="none"
          stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 36 36)"
        />
        <text x="36" y="41" textAnchor="middle" fill={color} fontSize="14" fontWeight="bold">
          {value ?? '—'}
        </text>
      </svg>
      <span className="text-xs text-slate-400">{label}</span>
    </div>
  );
}

// ---------- main component ----------

export default function IELTSConversation() {
  const { id } = useParams();
  const { user } = useAuth();
  const { language } = useThemeLanguage();

  const activeTutor = user?.guide_preference || 'MALE';
  const tutorAvatar = activeTutor === 'FEMALE' ? femaleAvatar : maleAvatar;
  const tutorName = activeTutor === 'FEMALE'
    ? (language === 'bn' ? 'Riya (রিয়া)' : 'Riya')
    : (language === 'bn' ? 'Rohit (রোহিত)' : 'Rohit');

  // page load
  const [chapter, setChapter] = useState(null);
  const [loadingChapter, setLoadingChapter] = useState(true);

  // conversation state machine
  // phase: idle | starting | active | ending | report
  // turnPhase: ai_speaking | user_ready | recording | processing
  const [phase, setPhase] = useState('idle');
  const [turnPhase, setTurnPhase] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [topic, setTopic] = useState('');
  const [turns, setTurns] = useState([]); // { role: 'ai'|'user', text, pronScore, fluencyScore, words }
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const chatEndRef = useRef(null);
  const currentAudioRef = useRef(null);
  const recordingUrlsRef = useRef([]); // tracks blob URLs for cleanup on unmount

  // revoke all blob URLs when the page unmounts to free memory
  useEffect(() => {
    return () => { recordingUrlsRef.current.forEach(u => URL.revokeObjectURL(u)); };
  }, []);

  // load chapter on mount
  useEffect(() => {
    async function load() {
      try {
        const res = await getChapter(id);
        setChapter(res.chapter);
      } catch {
        setError('Failed to load chapter.');
      } finally {
        setLoadingChapter(false);
      }
    }
    load();
  }, [id]);

  // scroll to bottom on new turns
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, turnPhase]);

  // play AI audio (base64 mp3), returns promise that resolves when done
  const playAudio = useCallback((base64) => {
    return new Promise((resolve) => {
      if (!base64) { resolve(); return; }
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      const audio = new Audio(`data:audio/mp3;base64,${base64}`);
      currentAudioRef.current = audio;
      audio.onended = () => { currentAudioRef.current = null; resolve(); };
      audio.onerror = () => { currentAudioRef.current = null; resolve(); };
      audio.play().catch(() => resolve());
    });
  }, []);

  // ---------- start conversation ----------
  const handleStart = async () => {
    setPhase('starting');
    setError('');
    try {
      const res = await startConversationSession(parseInt(id, 10));
      setSessionId(res.sessionId);
      setTopic(res.topic || chapter?.title || '');
      setTurns([{ role: 'ai', text: res.aiText }]);
      setPhase('active');
      setTurnPhase('ai_speaking');
      await playAudio(res.aiAudio);
      setTurnPhase('user_ready');
    } catch (e) {
      setError(e.message || 'Failed to start conversation.');
      setPhase('idle');
    }
  };

  // ---------- recording ----------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.start(250);
      mediaRecorderRef.current = recorder;
      setTurnPhase('recording');
    } catch (e) {
      setError('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const stopRecordingAndSubmit = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    recorder.onstop = async () => {
      const mimeType = recorder.mimeType;
      const blob = new Blob(chunksRef.current, { type: mimeType });
      recorder.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current = null;

      // Create a blob URL so the user can replay this recording in the report
      const audioUrl = URL.createObjectURL(blob);
      recordingUrlsRef.current.push(audioUrl);

      setTurnPhase('processing');
      try {
        const res = await submitConversationTurn(sessionId, blob, mimeType);
        setTurns(prev => [
          ...prev,
          {
            role: 'user',
            text: res.transcript || '(could not recognize speech)',
            pronScore: res.pron_score,
            fluencyScore: res.fluency_score,
            words: res.words || [],
            audioUrl
          },
          { role: 'ai', text: res.aiText }
        ]);
        setTurnPhase('ai_speaking');
        await playAudio(res.aiAudio);
        setTurnPhase('user_ready');
      } catch (e) {
        setError(e.message || 'Failed to process turn.');
        setTurnPhase('user_ready');
      }
    };
    recorder.stop();
  };

  // ---------- end conversation ----------
  const handleEnd = async () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current = null;
    }
    setPhase('ending');
    try {
      const res = await endConversationSession(sessionId);
      setReport(res.report);
      setPhase('report');
    } catch (e) {
      setError(e.message || 'Failed to generate report.');
      setPhase('active');
      setTurnPhase('user_ready');
    }
  };

  // ---------- render helpers ----------

  if (loadingChapter) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400" size={32} />
      </div>
    );
  }

  if (phase === 'report' && report) {
    return <ReportScreen report={report} chapter={chapter} topic={topic} turns={turns} onBack={() => window.history.back()} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* header */}
      <div className="border-b border-white/8 px-4 py-3 flex items-center gap-3 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <Link to={`/chapters/${id}`} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors text-slate-400 hover:text-white">
          <ChevronLeft size={20} />
        </Link>
        <img src={tutorAvatar} alt={tutorName} className="w-8 h-8 rounded-full object-cover ring-2 ring-cyan-500/40" />
        <div>
          <p className="text-sm font-bold text-slate-100">{tutorName}</p>
          <p className="text-[10px] text-slate-400">IELTS Speaking Practice</p>
        </div>
        {phase === 'active' && (
          <button
            onClick={handleEnd}
            className="ml-auto px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/25 rounded-lg text-xs font-bold transition-colors"
          >
            End Conversation
          </button>
        )}
      </div>

      {/* topic strip */}
      {topic && (
        <div className="px-4 py-2 bg-indigo-900/20 border-b border-indigo-500/15 text-xs text-indigo-300">
          <span className="font-semibold text-indigo-200">Topic:</span> {topic}
        </div>
      )}

      {/* error */}
      {error && (
        <div className="mx-4 mt-3 p-3 bg-red-900/30 border border-red-500/25 rounded-lg text-sm text-red-300 flex items-center gap-2">
          <AlertCircle size={14} /> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-200 text-xs underline">dismiss</button>
        </div>
      )}

      {/* chat messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {phase === 'idle' && (
          <IdleScreen chapter={chapter} tutorAvatar={tutorAvatar} tutorName={tutorName} onStart={handleStart} />
        )}

        {phase === 'starting' && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <Loader2 className="animate-spin text-cyan-400 mx-auto mb-3" size={32} />
              <p className="text-slate-400 text-sm">Starting conversation…</p>
            </div>
          </div>
        )}

        {(phase === 'active' || phase === 'ending') && turns.map((turn, i) => (
          <ChatBubble
            key={i}
            turn={turn}
            tutorAvatar={tutorAvatar}
            tutorName={tutorName}
            isLast={i === turns.length - 1 && turn.role === 'ai' && turnPhase === 'ai_speaking'}
          />
        ))}

        {phase === 'active' && turnPhase === 'processing' && (
          <div className="flex items-center gap-2 text-slate-400 text-sm pl-10">
            <Loader2 className="animate-spin" size={14} />
            Processing your response…
          </div>
        )}

        {phase === 'ending' && (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <Loader2 className="animate-spin text-indigo-400 mx-auto mb-3" size={28} />
              <p className="text-slate-400 text-sm">Generating your report…</p>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* bottom controls */}
      {phase === 'active' && (
        <div className="border-t border-white/8 px-4 py-4 bg-slate-950/80 backdrop-blur">
          {turnPhase === 'ai_speaking' && (
            <div className="flex items-center justify-center gap-2 text-cyan-400 text-sm py-1">
              <Volume2 size={16} className="animate-pulse" />
              {tutorName} is speaking…
            </div>
          )}

          {turnPhase === 'user_ready' && (
            <button
              onClick={startRecording}
              className="w-full py-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              <Mic size={18} /> Start Talking
            </button>
          )}

          {turnPhase === 'recording' && (
            <button
              onClick={stopRecordingAndSubmit}
              className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/35 text-red-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors animate-pulse"
            >
              <MicOff size={18} /> Stop Talking
            </button>
          )}

          {turnPhase === 'processing' && (
            <div className="w-full py-3 bg-slate-800/50 border border-white/8 text-slate-400 font-bold rounded-xl flex items-center justify-center gap-2">
              <Loader2 size={16} className="animate-spin" /> Processing…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- idle screen ----------

function IdleScreen({ chapter, tutorAvatar, tutorName, onStart }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6 py-8">
      <img src={tutorAvatar} alt={tutorName} className="w-20 h-20 rounded-full object-cover ring-4 ring-cyan-500/30 shadow-xl" />
      <div>
        <h2 className="text-xl font-extrabold text-slate-100">{tutorName}</h2>
        <p className="text-sm text-slate-400 mt-1">IELTS Speaking Practice Partner</p>
      </div>
      {chapter && (
        <div className="bg-slate-900/60 border border-white/8 rounded-2xl px-6 py-4 max-w-sm w-full text-left">
          <p className="text-xs font-semibold text-indigo-300 mb-1">Chapter</p>
          <p className="font-bold text-slate-200">{chapter.title}</p>
          {chapter.description && (
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{chapter.description}</p>
          )}
        </div>
      )}
      <div className="max-w-sm text-xs text-slate-500 leading-relaxed">
        Your tutor will start the conversation. Speak naturally when prompted.
        Your pronunciation and fluency are assessed in real time.
      </div>
      <button
        onClick={onStart}
        className="px-8 py-3.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/35 text-cyan-300 font-extrabold rounded-2xl flex items-center gap-2.5 transition-colors text-sm"
      >
        <MessageSquare size={16} /> Start Conversation
      </button>
    </div>
  );
}

// ---------- chat bubble ----------

function ChatBubble({ turn, tutorAvatar, tutorName, isLast }) {
  const isAI = turn.role === 'ai';
  return (
    <div className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}>
      {isAI ? (
        <img src={tutorAvatar} alt={tutorName} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-cyan-500/30" />
      ) : (
        <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/25 shrink-0 mt-0.5 flex items-center justify-center text-indigo-300 text-xs font-bold">
          You
        </div>
      )}
      <div className={`max-w-[75%] ${isAI ? '' : 'items-end flex flex-col'}`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isAI
            ? 'bg-slate-800/80 border border-white/8 text-slate-200 rounded-tl-sm'
            : 'bg-indigo-900/50 border border-indigo-500/20 text-slate-200 rounded-tr-sm'
        }`}>
          {turn.text}
          {isLast && (
            <span className="ml-1.5 inline-flex items-center gap-0.5 text-cyan-400/60 text-xs">
              <Volume2 size={10} className="animate-pulse" /> speaking
            </span>
          )}
        </div>
        {!isAI && (
          <>
            <PronScoreBadge pronScore={turn.pronScore} fluencyScore={turn.fluencyScore} />
            <WordBreakdown words={turn.words} />
          </>
        )}
      </div>
    </div>
  );
}

// ---------- report screen ----------

function ReportScreen({ report, chapter, topic, turns = [], onBack }) {
  const userTurns = turns.filter(t => t.role === 'user');
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-10">
      {/* header */}
      <div className="border-b border-white/8 px-4 py-3 flex items-center gap-3 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/8 transition-colors text-slate-400 hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <div>
          <p className="text-sm font-bold text-slate-100">Conversation Report</p>
          {topic && <p className="text-[10px] text-slate-400">{topic}</p>}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">
        {/* band + scores */}
        <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-400 mb-1">IELTS Band</p>
              <p className={`text-5xl font-extrabold ${bandColor(report.ielts_band)}`}>
                {report.ielts_band?.toFixed?.(1) ?? '—'}
              </p>
            </div>
            <div className="flex gap-5">
              <ScoreCircle label="Pronunciation" value={report.pron_avg} />
              <ScoreCircle label="Fluency" value={report.fluency_avg} />
            </div>
          </div>
          {report.summary_bn && (
            <p className="mt-4 text-sm text-slate-300 border-t border-white/8 pt-4">{report.summary_bn}</p>
          )}
        </div>

        {/* your recordings */}
        {userTurns.some(t => t.audioUrl) && (
          <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4">
            <h3 className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3">
              <Mic size={13} /> Your Recordings
            </h3>
            <div className="space-y-3">
              {userTurns.map((t, i) => (
                <div key={i} className="bg-slate-800/50 rounded-xl px-3 py-2.5">
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-500 shrink-0 pt-0.5 w-12">Turn {i + 1}</span>
                    <p className="text-xs text-slate-300 leading-relaxed grow">{t.text}</p>
                  </div>
                  <div className="pl-14 flex items-center gap-3">
                    {t.audioUrl && <AudioPlayer src={t.audioUrl} />}
                    <PronScoreBadge pronScore={t.pronScore} fluencyScore={t.fluencyScore} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* strengths + weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {report.strengths?.length > 0 && (
            <div className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold text-emerald-300 mb-3">
                <CheckCircle2 size={13} /> Strengths
              </h3>
              <ul className="space-y-1.5">
                {report.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-emerald-200 flex items-start gap-1.5">
                    <span className="text-emerald-400 mt-0.5 shrink-0">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.weaknesses?.length > 0 && (
            <div className="bg-red-900/20 border border-red-500/20 rounded-xl p-4">
              <h3 className="flex items-center gap-2 text-xs font-bold text-red-300 mb-3">
                <AlertCircle size={13} /> Weaknesses
              </h3>
              <ul className="space-y-1.5">
                {report.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-red-200 flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5 shrink-0">•</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* mispronounced words */}
        {report.mispronounced_words?.length > 0 && (
          <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4">
            <h3 className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3">
              <BookOpen size={13} /> Mispronounced Words
            </h3>
            <div className="flex flex-wrap gap-2">
              {report.mispronounced_words.map((w, i) => (
                <div key={i} className="bg-orange-900/30 border border-orange-500/20 rounded-lg px-2.5 py-1.5 text-xs">
                  <span className="font-bold text-orange-300">{w.word}</span>
                  {w.suggestion && <span className="text-slate-400 ml-1.5">→ {w.suggestion}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* fluency issues */}
        {report.fluency_issues?.length > 0 && (
          <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4">
            <h3 className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3">
              <BarChart2 size={13} /> Fluency Issues
            </h3>
            <ul className="space-y-1.5">
              {report.fluency_issues.map((fi, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                  <span className="text-yellow-400 mt-0.5 shrink-0">•</span> {fi.description}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* improvement tips */}
        {report.improvement_tips?.length > 0 && (
          <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-4">
            <h3 className="flex items-center gap-2 text-xs font-bold text-indigo-300 mb-3">
              <Lightbulb size={13} /> Improvement Tips
            </h3>
            <ol className="space-y-1.5 list-decimal list-inside">
              {report.improvement_tips.map((tip, i) => (
                <li key={i} className="text-xs text-indigo-200">{tip}</li>
              ))}
            </ol>
          </div>
        )}

        {/* turn breakdown */}
        {report.turn_breakdown?.length > 0 && (
          <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4">
            <h3 className="flex items-center gap-2 text-xs font-bold text-slate-300 mb-3">
              <Star size={13} /> Turn-by-Turn Breakdown
            </h3>
            <div className="space-y-2">
              {report.turn_breakdown.map((t, i) => (
                <div key={i} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2">
                  <span className="text-xs font-bold text-slate-500 w-12 shrink-0">Turn {t.turn}</span>
                  {t.pron_score != null && (
                    <span className={`text-xs font-bold ${scoreColor(t.pron_score)}`}>{t.pron_score}</span>
                  )}
                  <span className="text-xs text-slate-400 grow">{t.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* back button */}
        <button
          onClick={onBack}
          className="w-full py-3 bg-slate-800/60 hover:bg-slate-700/60 border border-white/8 text-slate-300 font-bold rounded-xl text-sm transition-colors"
        >
          Back to Chapter
        </button>
      </div>
    </div>
  );
}

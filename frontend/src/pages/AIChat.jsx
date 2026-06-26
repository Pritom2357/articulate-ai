import { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth.js';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';
import { Sparkles, Send, Mic, MicOff, AlertCircle, Volume2, BookOpen, User, AlertTriangle } from 'lucide-react';
import { generalChat, textToSpeech, getChatHistory } from '../api/progress.js';
import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articulate_female.jpeg';
import { speakText } from '../utils/tts.js';
import { playWordAudio } from '../utils/playWordAudio.js';

const LS_MISTAKE = 'chat_mistakeDetector';
const LS_PROFILE = 'chat_profileTracker';
const lsKey = (userId) => `articulate_chat_${userId}`;

function loadLocalSession(userId) {
  try {
    const raw = localStorage.getItem(lsKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLocalSession(userId, sessionId, messages) {
  try { localStorage.setItem(lsKey(userId), JSON.stringify({ sessionId, messages })); }
  catch { /* quota exceeded */ }
}

export default function AIChat() {
  const { user } = useAuth();
  const { language } = useThemeLanguage();

  const [messages, setMessages]           = useState([]);
  const [sessionId, setSessionId]         = useState(null);
  const [input, setInput]                 = useState('');
  const [isTyping, setIsTyping]           = useState(false);
  const [isListening, setIsListening]     = useState(false);
  const [error, setError]                 = useState('');
  const [playingIdx, setPlayingIdx]       = useState(null);
  const [wordAudioPlaying, setWordAudioPlaying] = useState(false);

  const audioRef     = useRef(null);
  const wordAudioRef = useRef(null);
  const recognitionRef = useRef(null);
  const chatEndRef   = useRef(null);

  const [mistakeDetector, setMistakeDetector] = useState(() => {
    const v = localStorage.getItem(LS_MISTAKE);
    return v === null ? true : v === 'true';
  });
  const [profileTracker, setProfileTracker] = useState(
    () => localStorage.getItem(LS_PROFILE) === 'true'
  );

  const activeTutor = user?.guide_preference || 'MALE';
  const tutorAvatar = activeTutor === 'FEMALE' ? femaleAvatar : maleAvatar;
  const tutorName   = activeTutor === 'FEMALE'
    ? (language === 'bn' ? 'Riya (রিয়া)' : 'Riya')
    : (language === 'bn' ? 'Rohit (রোহিত)' : 'Rohit');

  const welcomeMessage = {
    role: 'assistant',
    content: language === 'bn'
      ? `হ্যালো! আমি ${tutorName}, আপনার এআই ইংলিশ গাইড। আপনি আমার সাথে যেকোনো বিষয়ে ইংরেজিতে কথা বলতে পারেন। আপনার আজকের দিনটি কেমন কাটছে?`
      : `Hi ${user?.name || 'there'}! I am ${tutorName}, your AI English Guide. You can talk to me about anything in English. If you make any mistakes, I will help you correct them. How is your day going?`,
  };

  useEffect(() => {
    if (!user?.id) return;

    const local = loadLocalSession(user.id);
    if (local?.messages?.length) {
      setMessages(local.messages);
      setSessionId(local.sessionId);
      if (local.sessionId) {
        getChatHistory(local.sessionId).then(data => {
          if (data?.success && data.messages?.length) {
            setMessages(data.messages);
            saveLocalSession(user.id, local.sessionId, data.messages);
          }
        }).catch(() => {});
      }
    } else {
      setMessages([welcomeMessage]);
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false; rec.interimResults = false; rec.lang = 'en-US';
      rec.onresult = (e) => setInput(e.results[0][0].transcript);
      rec.onend = () => setIsListening(false);
      recognitionRef.current = rec;
    }
  }, [user?.id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const toggleMistakeDetector = () => {
    const next = !mistakeDetector; setMistakeDetector(next);
    localStorage.setItem(LS_MISTAKE, String(next));
  };
  const toggleProfileTracker = () => {
    const next = !profileTracker; setProfileTracker(next);
    localStorage.setItem(LS_PROFILE, String(next));
  };
  const toggleListening = () => {
    if (!recognitionRef.current) { alert('Speech Recognition not supported. Use Chrome.'); return; }
    if (isListening) { recognitionRef.current.stop(); }
    else { setInput(''); setIsListening(true); recognitionRef.current.start(); }
  };

  const cleanForSpeech = (text) =>
    text.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').replace(/[\u{2600}-\u{27BF}]/gu, '').replace(/\s{2,}/g, ' ').trim();

  const handleReadAloud = async (text, msgIndex) => {
    if (playingIdx === msgIndex) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      window.speechSynthesis?.cancel(); setPlayingIdx(null); return;
    }
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    window.speechSynthesis?.cancel();
    const clean = cleanForSpeech(text);
    try {
      setPlayingIdx(msgIndex);
      const voice = activeTutor === 'FEMALE' ? 'en-US-JennyNeural' : 'en-US-GuyNeural';
      const blob = await textToSpeech(clean, voice);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url); audioRef.current = audio;
      audio.onended = () => { setPlayingIdx(null); audioRef.current = null; URL.revokeObjectURL(url); };
      audio.onerror = () => { audioRef.current = null; URL.revokeObjectURL(url); speakText(clean, activeTutor, () => setPlayingIdx(msgIndex), () => setPlayingIdx(null)); };
      await audio.play();
    } catch { audioRef.current = null; speakText(clean, activeTutor, () => setPlayingIdx(msgIndex), () => setPlayingIdx(null)); }
  };

  const handleWordAudio = async (wordData) => {
    if (wordAudioRef.current) { wordAudioRef.current.pause(); wordAudioRef.current = null; }
    if (wordData.audio_url || wordData.audio_url_m) {
      playWordAudio(wordData, activeTutor, () => setWordAudioPlaying(true), () => setWordAudioPlaying(false));
      return;
    }
    setWordAudioPlaying(true);
    try {
      const voice = activeTutor === 'FEMALE' ? 'en-US-JennyNeural' : 'en-US-GuyNeural';
      const blob = await textToSpeech(wordData.word, voice);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url); wordAudioRef.current = audio;
      audio.onended = () => { setWordAudioPlaying(false); wordAudioRef.current = null; URL.revokeObjectURL(url); };
      audio.onerror = () => { setWordAudioPlaying(false); wordAudioRef.current = null; URL.revokeObjectURL(url); };
      await audio.play();
    } catch { setWordAudioPlaying(false); }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const userMessage = input.trim();
    setInput(''); setError('');
    const withUserMsg = [...messages, { role: 'user', content: userMessage }];
    setMessages(withUserMsg); setIsTyping(true);
    try {
      const data = await generalChat({ messages: withUserMsg, mistakeCheck: mistakeDetector, includeProfile: profileTracker, sessionId });
      if (data.success) {
        if (data.sessionId && data.sessionId !== sessionId) setSessionId(data.sessionId);
        const next = [...withUserMsg];
        if (data.grammarErrors) {
          for (let j = next.length - 1; j >= 0; j--) {
            if (next[j].role === 'user') { next[j] = { ...next[j], grammarErrors: data.grammarErrors }; break; }
          }
        }
        if (data.wordPanel) next.push({ role: 'assistant', content: null, wordPanel: data.wordPanel });
        else next.push({ role: 'assistant', content: data.response });
        setMessages(next);
        saveLocalSession(user.id, data.sessionId || sessionId, next);
      } else throw new Error(data.error || 'Server error');
    } catch (err) { console.error(err); setError('Failed to get response. Please try again.'); }
    finally { setIsTyping(false); }
  };

  return (
    <div className="ai-chat-card">
      {/* ── Header: title left, avatar+toggles right ── */}
      <div className="ai-chat-header">
        <div className="flex-1 min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-bold text-indigo-400">
            <Sparkles size={20} className="text-cyan-400 animate-pulse shrink-0" />
            AI Chat Assistant
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {language === 'bn'
              ? 'আপনার টিউটরের সাথে ইংরেজিতে কথা বলুন।'
              : 'Talk to your tutor on any topic and practice your English.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Agent toggles */}
          <button onClick={toggleMistakeDetector}
            title={mistakeDetector ? 'Mistake detector ON' : 'Mistake detector OFF'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
              mistakeDetector ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
            }`}>
            <AlertTriangle size={12} /><span className="hidden sm:inline">Mistakes</span>
          </button>
          <button onClick={toggleProfileTracker}
            title={profileTracker ? 'Profile tracker ON' : 'Profile tracker OFF'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
              profileTracker ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
            }`}>
            <User size={12} /><span className="hidden sm:inline">Profile</span>
          </button>

          {/* Tutor avatar */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-indigo-500/40 shrink-0">
              <img src={tutorAvatar} alt={tutorName} className="w-full h-full object-cover" />
            </div>
            <span className="text-[10px] text-slate-500 leading-none">{tutorName.split(' ')[0]}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-3 glass-alert glass-alert-error flex items-center gap-2 shrink-0">
          <AlertCircle size={16} /><span>{error}</span>
        </div>
      )}

      {/* ── Messages — only this area scrolls ── */}
      <div className="ai-chat-messages space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className="space-y-2">
            {msg.content !== null && (
              <div className={`flex gap-3 max-w-[78%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10 mt-0.5">
                    <img src={tutorAvatar} alt="Tutor" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={msg.role === 'user' ? 'ai-chat-bubble-user' : 'ai-chat-bubble-assistant'}>
                  {msg.content}
                  {msg.role === 'assistant' && (
                    <button onClick={() => handleReadAloud(msg.content, i)}
                      className={`ai-chat-audio-btn ${playingIdx === i ? 'playing' : ''}`}>
                      <Volume2 size={14} />
                      {playingIdx === i ? 'Playing...' : 'Read aloud'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {msg.grammarErrors?.length > 0 && (
              <div className="flex gap-3 max-w-[78%]">
                <div className="w-8 shrink-0" />{/* spacer aligns with assistant avatar */}
                <div className="flex-1 rounded-lg border border-yellow-500/40 bg-yellow-950/25 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-yellow-400 text-xs font-semibold">
                    <AlertTriangle size={12} /> Grammar corrections
                  </div>
                  {msg.grammarErrors.map((err, ei) => (
                    <div key={ei} className="text-xs space-y-0.5">
                      <div>
                        <span className="line-through text-red-400">{err.original}</span>
                        <span className="text-slate-500 mx-1">→</span>
                        <span className="text-green-400 font-medium">{err.corrected}</span>
                      </div>
                      {err.explanation && <div className="text-slate-500 pl-1">{err.explanation}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {msg.wordPanel && (
              <div className="flex gap-3 max-w-[88%]">
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10 mt-1">
                  <img src={tutorAvatar} alt="Tutor" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 rounded-xl border border-cyan-500/30 bg-cyan-950/25 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BookOpen size={13} className="text-cyan-400" />
                      <span className="text-xs text-cyan-400 font-semibold uppercase tracking-wide">Word Lookup</span>
                    </div>
                    <button onClick={() => handleWordAudio(msg.wordPanel)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-medium transition-colors shrink-0">
                      <Volume2 size={13} />
                      {wordAudioPlaying ? 'Playing…' : 'Pronounce'}
                    </button>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl font-bold text-white">{msg.wordPanel.word}</span>
                      {msg.wordPanel.part_of_speech && <span className="text-xs text-slate-400 italic">{msg.wordPanel.part_of_speech}</span>}
                    </div>
                    {msg.wordPanel.ipa && <div className="text-sm text-cyan-300 font-mono">/{msg.wordPanel.ipa}/</div>}
                    {msg.wordPanel.syllables && <div className="text-xs text-slate-500">Syllables: {msg.wordPanel.syllables}</div>}
                  </div>
                  <div className="border-t border-white/5" />
                  {msg.wordPanel.bangla_meaning && (
                    <div className="space-y-0.5">
                      <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">বাংলা অর্থ</div>
                      <div className="text-sm text-slate-200">{msg.wordPanel.bangla_meaning}</div>
                    </div>
                  )}
                  {msg.wordPanel.english_meaning && (
                    <div className="space-y-0.5">
                      <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Meaning</div>
                      <div className="text-sm text-slate-300">{msg.wordPanel.english_meaning}</div>
                    </div>
                  )}
                  {msg.wordPanel.example && (
                    <div className="space-y-0.5">
                      <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Example</div>
                      <div className="text-sm text-slate-400 italic">"{msg.wordPanel.example}"</div>
                    </div>
                  )}
                  {msg.wordPanel.pronunciation_tip && (
                    <div className="text-xs text-slate-500 border-t border-white/5 pt-2">
                      Say it: <span className="text-slate-400 font-medium">{msg.wordPanel.pronunciation_tip}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 max-w-[78%]">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10">
              <img src={tutorAvatar} alt="Tutor" className="w-full h-full object-cover" />
            </div>
            <div className="ai-chat-typing-bubble">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── Input bar — all buttons here, fixed at bottom ── */}
      <form onSubmit={handleSend} className="ai-chat-form">
        <input
          className="ai-chat-input"
          placeholder={isListening ? 'Listening...' : 'Write your message in English...'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isTyping}
        />
        {/* Mic */}
        <button type="button" onClick={toggleListening}
          className={`ai-chat-mic-btn ${isListening ? 'listening' : ''}`} title="Speech-to-text">
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
        {/* Mistakes toggle */}
        <button type="button" onClick={toggleMistakeDetector}
          title={mistakeDetector ? 'Mistake detector ON' : 'Mistake detector OFF'}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all text-xs font-bold shrink-0 ${
            mistakeDetector ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300' : 'bg-white/5 border-white/10 text-slate-600 hover:text-slate-400'
          }`}>
          <AlertTriangle size={14} />
        </button>
        {/* Profile toggle */}
        <button type="button" onClick={toggleProfileTracker}
          title={profileTracker ? 'Profile tracker ON' : 'Profile tracker OFF'}
          className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all shrink-0 ${
            profileTracker ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' : 'bg-white/5 border-white/10 text-slate-600 hover:text-slate-400'
          }`}>
          <User size={14} />
        </button>
        {/* Send */}
        <button type="submit" className="ai-chat-send-btn" disabled={isTyping || !input.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

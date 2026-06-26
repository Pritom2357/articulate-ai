import { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth.js';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';
import { Sparkles, Send, Mic, MicOff, AlertCircle, Volume2 } from 'lucide-react';
import { generalChat, textToSpeech } from '../api/progress.js';
import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articulate_female.jpeg';
import { speakText } from '../utils/tts.js';
export default function AIChat() {
  const { user } = useAuth();
  const { language } = useThemeLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const [playingIdx, setPlayingIdx] = useState(null);
  const audioRef = useRef(null);

  const activeTutor = user?.guide_preference || 'MALE';
  const tutorAvatar = activeTutor === 'FEMALE' ? femaleAvatar : maleAvatar;
  const tutorName = activeTutor === 'FEMALE'
    ? (language === 'bn' ? 'Riya (রিয়া)' : 'Riya')
    : (language === 'bn' ? 'Rohit (রোহিত)' : 'Rohit');

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        content: language === 'bn'
          ? `হ্যালো! আমি ${tutorName}, আপনার এআই ইংলিশ গাইড। আপনি আমার সাথে যেকোনো বিষয়ে ইংরেজিতে কথা বলতে পারেন। যদি কোনো ভুল করেন, আমি তা সংশোধন করতে সাহায্য করব। আপনার আজকের দিনটি কেমন কাটছে?`
          : `Hi ${user?.name || 'there'}! I am ${tutorName}, your AI English Guide. You can talk to me about anything in English. If you make any mistakes, I will help you correct them. How is your day going?`
      }
    ]);

    // Setup speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setInput(text);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [user, tutorName]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Your browser does not support Speech Recognition. Please use Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInput('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleReadAloud = async (text, msgIndex) => {
    // 1. If currently playing this message, pause/stop it.
    if (playingIdx === msgIndex) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined') {
        window.speechSynthesis?.cancel();
      }
      setPlayingIdx(null);
      return;
    }

    // 2. Stop any other audio/speech currently playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined') {
      window.speechSynthesis?.cancel();
    }

    try {
      setPlayingIdx(msgIndex);
      const voice = activeTutor === 'FEMALE' ? 'en-US-JennyNeural' : 'en-US-GuyNeural';
      const audioBlob = await textToSpeech(text, voice);
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingIdx(null);
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (e) => {
        console.warn('Audio element error, falling back to Web Speech API', e);
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
        playSpeechSynthesisFallback(text, msgIndex);
      };

      await audio.play();
    } catch (err) {
      console.warn('Backend TTS failed, falling back to browser SpeechSynthesis:', err);
      audioRef.current = null;
      playSpeechSynthesisFallback(text, msgIndex);
    }
  };

  const playSpeechSynthesisFallback = (text, msgIndex) => {
    try {
      speakText(text, activeTutor, () => {
        setPlayingIdx(msgIndex);
      }, () => {
        setPlayingIdx(null);
      });
    } catch (speechErr) {
      console.error('Browser SpeechSynthesis failed:', speechErr);
      setPlayingIdx(null);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    setError('');

    // Append user message
    const updatedMessages = [...messages, { role: 'user', content: userMessage }];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const data = await generalChat({ messages: updatedMessages });
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to get response. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <div className="page-header border-b border-white/10 pb-4 mb-6">
        <div>
          <h1 className="page-title text-indigo-400 flex items-center gap-2">
            <Sparkles className="text-cyan-400 animate-pulse" /> AI Chat Assistant
          </h1>
          <p className="page-subtitle text-slate-400">
            {language === 'bn' 
              ? 'আপনার গাইড টিউটরের সাথে যেকোনো বিষয়ে কথা বলুন এবং আপনার ইংরেজি চর্চা করুন।' 
              : 'Talk to your guide tutor on any topic and practice your English.'}
          </p>
        </div>
      </div>

      {error && (
        <div className="glass-alert glass-alert-error mb-4 flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="ai-chat-card">
        {/* Tutor Header */}
        <div className="ai-chat-header">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
            <img src={tutorAvatar} alt="Tutor" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="ai-chat-tutor-name">{tutorName}</div>
            <div className="ai-chat-tutor-role">AI Personal English Tutor</div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                  <img src={tutorAvatar} alt="Tutor" className="w-full h-full object-cover" />
                </div>
              )}
              <div
                className={msg.role === 'user' ? 'ai-chat-bubble-user' : 'ai-chat-bubble-assistant'}
              >
                {msg.content}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleReadAloud(msg.content, i)}
                    className={`ai-chat-audio-btn ${playingIdx === i ? 'playing' : ''}`}
                    title={playingIdx === i ? 'Stop reading' : 'Read aloud'}
                  >
                    <Volume2 size={14} />
                    {playingIdx === i ? 'Playing...' : 'Read aloud'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                <img src={tutorAvatar} alt="Tutor" className="w-full h-full object-cover" />
              </div>
              <div className="ai-chat-typing-bubble">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="ai-chat-form">
          <button
            type="button"
            onClick={toggleListening}
            className={`ai-chat-mic-btn ${isListening ? 'listening' : ''}`}
            title="Speech-to-text"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <input
            className="ai-chat-input"
            placeholder={isListening ? 'Listening...' : 'Write your message in English...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
          />
          <button
            type="submit"
            className="ai-chat-send-btn"
            disabled={isTyping || !input.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

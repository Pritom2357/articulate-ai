import { useState, useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth.js';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';
import { Sparkles, Send, Mic, MicOff, AlertCircle, Volume2 } from 'lucide-react';
import { generalChat, textToSpeech } from '../api/progress.js';
import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articucate_female.jpeg';

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
    if (playingIdx === msgIndex && audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingIdx(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
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

      audio.onerror = () => {
        setPlayingIdx(null);
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (err) {
      console.error('Read aloud failed:', err);
      setPlayingIdx(null);
      audioRef.current = null;
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

      <div className="card-card p-0 overflow-hidden flex flex-col h-[550px] bg-slate-950/40 border border-white/10 shadow-xl">
        {/* Tutor Header */}
        <div className="bg-indigo-950/80 text-white p-4 flex items-center gap-3 border-b border-white/5">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
            <img src={tutorAvatar} alt="Tutor" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-bold text-sm">{tutorName}</div>
            <div className="text-xs text-indigo-300">AI Personal English Tutor</div>
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
                className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                    : 'bg-slate-800 text-white rounded-tl-none border border-slate-700/50 shadow-sm'
                  }`}
              >
                {msg.content}
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleReadAloud(msg.content, i)}
                    className={`mt-2 flex items-center gap-1 text-xs border-none cursor-pointer transition ${playingIdx === i
                        ? 'text-cyan-400 animate-pulse'
                        : 'text-slate-400 hover:text-indigo-300'
                      }`}
                    style={{ background: 'transparent', padding: '2px 0' }}
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
              <div className="bg-slate-800 border border-slate-700/50 p-3 rounded-2xl rounded-tl-none text-slate-400 text-xs shadow-sm flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.15s' }}></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.3s' }}></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="p-3 bg-slate-900/60 border-t border-white/5 flex gap-2 items-center">
          <button
            type="button"
            onClick={toggleListening}
            className={`w-10 h-10 rounded-full border-none flex items-center justify-center cursor-pointer transition ${isListening
                ? 'bg-red-500 text-white animate-pulse'
                : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25'
              }`}
            title="Speech-to-text"
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
          <input
            className="flex-grow p-3 rounded-xl bg-slate-950/60 border border-white/10 text-white outline-none text-sm focus:border-indigo-500 transition placeholder-slate-500"
            placeholder={isListening ? 'Listening...' : 'Write your message in English...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
          />
          <button
            type="submit"
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center border-none cursor-pointer transition"
            disabled={isTyping || !input.trim()}
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}

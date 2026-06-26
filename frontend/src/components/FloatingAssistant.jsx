import { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, X, ExternalLink, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { quickChat } from '../api/progress.js';
import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articulate_female.jpeg';

export default function FloatingAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen]         = useState(false);
  const [input, setInput]       = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);

  const tutorAvatar = user?.guide_preference === 'FEMALE' ? femaleAvatar : maleAvatar;
  const tutorName   = user?.guide_preference === 'FEMALE' ? 'Riya' : 'Rohit';

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hi! I'm ${tutorName}, your quick guide. Ask me where to find something or what to do next.`,
      }]);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    const userText = input.trim();
    setInput('');
    const updated = [...messages, { role: 'user', content: userText }];
    setMessages(updated);
    setIsTyping(true);
    try {
      const data = await quickChat(updated);
      if (data.success) {
        setMessages([...updated, { role: 'assistant', content: data.response }]);
      } else throw new Error(data.error);
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Something went wrong. Please try again or visit the AI Chat page.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="floating-assistant-btn"
        title={`Ask ${tutorName}`}
        aria-label="Open quick assistant"
      >
        {open
          ? <X size={22} />
          : <Sparkles size={22} className="animate-pulse" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="floating-assistant-panel">
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/8 bg-white/3 shrink-0">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-indigo-500/40 shrink-0">
              <img src={tutorAvatar} alt={tutorName} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-white leading-none">{tutorName}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Quick Assistant</div>
            </div>
            <button
              onClick={() => { navigate('/ai-chat'); setOpen(false); }}
              title="Open full AI Chat"
              className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors shrink-0">
              <ExternalLink size={11} /> Full chat
            </button>
            <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-300 transition-colors ml-1">
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="floating-assistant-messages space-y-2.5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/10 mt-0.5">
                    <img src={tutorAvatar} alt={tutorName} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className={`max-w-[82%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600/80 text-white rounded-tr-sm'
                    : 'bg-white/6 text-slate-200 rounded-tl-sm border border-white/5'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-white/10">
                  <img src={tutorAvatar} alt={tutorName} className="w-full h-full object-cover" />
                </div>
                <div className="bg-white/6 border border-white/5 rounded-2xl rounded-tl-sm px-3 py-2 flex gap-1 items-center">
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" />
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1 h-1 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="flex gap-2 px-3 py-2.5 border-t border-white/8 shrink-0">
            <input
              className="flex-1 text-xs px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10 text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 transition-colors"
              placeholder="Ask a quick question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={isTyping || !input.trim()}
              className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-colors shrink-0">
              {isTyping ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

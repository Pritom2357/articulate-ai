import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getChapter } from '../api/curriculum.js';
import { assessConversation, getRagSession } from '../api/progress.js';
import useAuth from '../hooks/useAuth.js';

// Import tutor assets
import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articulate_female.jpeg';

const TOPIC_QUESTIONS = {
  1: [
    "Hello! Welcome to the IELTS Speaking test. Let's start with Chapter 1 topic: Everyday Communication. Can you describe your hometown? Where do you live and what is it like?",
    "Interesting. What do you like most about your home or the place you live in?",
    "Great. Who do you live with, and what is your favorite room in your house?"
  ],
  2: [
    "Hello! Let's start the speaking test for Chapter 2: Daily Life. Can you describe your typical morning routine? What time do you wake up and what do you do?",
    "Nice. Do you prefer a busy work schedule or a relaxed routine?",
    "I see. How do you usually spend your weekends to relax after a long week?"
  ],
  3: [
    "Hello! Welcome to the speaking test for Chapter 3: Describe and Express. Can you describe a close friend or family member who has influenced you? What kind of person are they?",
    "Thank you. Why do you believe kind and honest people are important in our society?",
    "Excellent. Can you share a happy childhood memory that you will never forget?"
  ],
  4: [
    "Hello! Let's start the final speaking test for Chapter 4: Connect and Discuss. In your opinion, what are the main advantages and disadvantages of technology in modern life?",
    "Good point. Do you think mobile phones are causing too much distraction in our daily lives?",
    "Indeed. How do you think the internet will change the way we work and study in the future?"
  ]
};

export default function IELTSConversation() {
  const { id } = useParams(); // chapter ID
  const navigate = useNavigate();
  const { user } = useAuth();

  const [chapter, setChapter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isTutorTyping, setIsTutorTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Assessment results
  const [assessment, setAssessment] = useState(null);
  const [ragSessionData, setRagSessionData] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeTutor = user?.guide_preference || 'MALE';
  const tutorAvatar = activeTutor === 'FEMALE' ? femaleAvatar : maleAvatar;
  const tutorName = activeTutor === 'FEMALE' ? 'Riya (রিয়া)' : 'Rohit (রোহিত)';

  const recognitionRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    async function loadChapter() {
      try {
        setLoading(true);
        const result = await getChapter(id);
        setChapter(result.chapter);

        // Initialize chat with tutor first question
        const chId = parseInt(id);
        const questions = TOPIC_QUESTIONS[chId] || TOPIC_QUESTIONS[1];
        
        setMessages([
          { role: 'assistant', content: questions[0] }
        ]);
      } catch (err) {
        setError('Chapter details could not be loaded.');
      } finally {
        setLoading(false);
      }
    }
    loadChapter();
  }, [id]);

  // Speech Recognition setup (for transcribing user spoken answers)
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setCurrentInput(text);
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTutorTyping]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('আপনার ব্রাউজারে স্পিচ রিকগনিশন সাপোর্ট করে না। ক্রোম ব্রাউজার ব্যবহার করুন।');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setCurrentInput('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!currentInput.trim()) return;

    const newMessages = [...messages, { role: 'user', content: currentInput.trim() }];
    setMessages(newMessages);
    setCurrentInput('');

    // Advance to next question or assessment
    const nextQIndex = questionIndex + 1;
    const chId = parseInt(id);
    const questions = TOPIC_QUESTIONS[chId] || TOPIC_QUESTIONS[1];

    if (nextQIndex < questions.length) {
      setIsTutorTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: questions[nextQIndex] }]);
        setQuestionIndex(nextQIndex);
        setIsTutorTyping(false);
      }, 1500);
    } else {
      setIsTutorTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: "Thank you. We have completed our open conversation test. Click the button below to generate your IELTS scorecard." }]);
        setQuestionIndex(nextQIndex);
        setIsTutorTyping(false);
      }, 1500);
    }
  };

  const handleAssessConversation = async () => {
    setIsSubmitting(true);
    try {
      // Send conversation to backend
      const response = await assessConversation({
        chatMessages: messages,
        chapterId: parseInt(id)
      });
      setAssessment(response.assessment);

      // Load next session RAG guide
      const ragResponse = await getRagSession();
      setRagSessionData(ragResponse.recommendation);
    } catch (err) {
      console.error(err);
      setError('কথোপকথন মূল্যায়ন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="page-container text-center py-20 text-slate-500">IELTS Speaking Conversation Loading...</div>;
  }

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      
      {/* Chapter header info */}
      <div className="page-header border-b border-white/10 pb-4 mb-6">
        <div>
          <h1 className="page-title text-indigo-400">IELTS Speaking Test</h1>
          <p className="page-subtitle text-slate-400">
            Chapter {chapter?.order_num}: {chapter?.title} ({chapter?.title_bn})
          </p>
        </div>
      </div>

      {error && <div className="glass-alert glass-alert-error mb-4">{error}</div>}

      {!assessment ? (
        /* CHAT INTERFACE */
        <div className="card-card p-0 overflow-hidden flex flex-col h-[550px] bg-slate-950/40 border border-white/10 shadow-xl">
          {/* Active Tutor Header */}
          <div className="bg-indigo-950/80 text-white p-4 flex items-center gap-3 border-b border-white/5">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
              <img src={tutorAvatar} alt="Tutor" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="font-bold text-sm">{tutorName}</div>
              <div className="text-xs text-indigo-300">IELTS Speaking Examiner</div>
            </div>
          </div>

          {/* Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 max-w-[80%] ${
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10">
                    <img src={tutorAvatar} alt="Tutor" className="w-full h-full object-cover" />
                  </div>
                )}
                <div
                  className={`p-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none shadow-md'
                      : 'bg-slate-800 text-white rounded-tl-none border border-slate-700/50 shadow-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isTutorTyping && (
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

          {/* Chat Input or End Assessment Trigger */}
          {questionIndex < 3 ? (
            <form onSubmit={handleSendMessage} className="p-3 bg-slate-900/60 border-t border-white/5 flex gap-2 items-center">
              <button
                type="button"
                onClick={toggleListening}
                className={`w-10 h-10 rounded-full border-none flex items-center justify-center cursor-pointer transition ${
                  isListening
                    ? 'bg-red-500 text-white animate-pulse'
                    : 'bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/25'
                }`}
                style={{ fontSize: '1.2rem' }}
                title="Speak to type"
              >
                🎙️
              </button>
              <input
                className="flex-grow p-3 rounded-xl bg-slate-950/60 border border-white/10 text-white outline-none text-sm focus:border-indigo-500 transition placeholder-slate-500"
                placeholder={isListening ? 'কথা বলুন...' : 'উত্তর লিখুন বা মাইক আইকন ক্লিক করে বলুন...'}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                disabled={isTutorTyping}
              />
              <button
                type="submit"
                className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl border-none cursor-pointer text-sm shadow-md transition"
                disabled={isTutorTyping || !currentInput.trim()}
              >
                Send
              </button>
            </form>
          ) : (
            <div className="p-4 bg-slate-900/80 border-t border-white/5 text-center space-y-3">
              <div className="text-xs text-slate-400 font-semibold">
                কথোপকথন সম্পন্ন হয়েছে! এবার মূল্যায়নের সময়।
              </div>
              <button
                onClick={handleAssessConversation}
                disabled={isSubmitting}
                className="glass-button w-full bg-gradient-to-r from-indigo-600 to-cyan-500 text-white border-none py-3"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24" fill="none" style={{ display: 'inline-block' }}>
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                    </svg>
                    AI আপনার উত্তর মূল্যায়ন করছে...
                  </>
                ) : (
                  'Generate IELTS Scorecard & Study Guide (ফলাফল দেখুন)'
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* IELTS SCORECARD & RAG PLAN */
        <div className="space-y-6 animate-fade-in">
          
          {/* IELTS Scorecard */}
          <div className="card-card p-6 bg-slate-900/60 text-white border border-white/10 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl"></div>
            
            <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 mb-6">
              IELTS Speaking Scorecard
            </h2>

            <div className="grid grid-cols-[140px_1fr] gap-6 items-center border-b border-white/5 pb-6 mb-6">
              {/* Band Circle */}
              <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-400 flex flex-col items-center justify-center border-4 border-slate-800 shadow-lg">
                <div className="text-xs uppercase tracking-widest text-indigo-100 font-bold">IELTS Band</div>
                <div className="text-4xl font-black">{assessment.ielts_band}</div>
                <div className="text-[10px] text-indigo-200">Out of 9.0</div>
              </div>
              
              {/* Scoring breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Fluency & Coherence:</span>
                  <span className="font-bold text-cyan-400">Band {assessment.ielts_band}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Lexical Resource:</span>
                  <span className="font-bold text-indigo-400">{assessment.accuracy_score}% Accuracy</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Key Points Target Hit:</span>
                  <span className="font-bold text-emerald-400">
                    {assessment.key_points_found?.length || 0} / {assessment.key_points_found?.length + assessment.key_points_missing?.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Key Points Details */}
            <div className="space-y-4 mb-6">
              <div>
                <div className="text-xs uppercase font-bold text-slate-400 mb-2">আপনি যেসব বিষয় নিয়ে কথা বলেছেন (Key Points Hit):</div>
                <div className="flex flex-wrap gap-2">
                  {assessment.key_points_found?.map((kp, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      ✓ {kp}
                    </span>
                  ))}
                  {assessment.key_points_found?.length === 0 && (
                    <span className="text-slate-500 text-xs italic">কোনো বিষয় পাওয়া যায়নি।</span>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase font-bold text-slate-400 mb-2">যেসব বিষয়ে কথা বলেননি (Key Points Missed):</div>
                <div className="flex flex-wrap gap-2">
                  {assessment.key_points_missing?.map((kp, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md text-xs bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
                      ✗ {kp}
                    </span>
                  ))}
                  {assessment.key_points_missing?.length === 0 && (
                    <span className="text-slate-500 text-xs italic">সবগুলো বিষয় সুন্দরভাবে কভার করেছেন!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Bangla Feedback */}
            <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 text-slate-300 text-sm leading-relaxed">
              <div className="font-bold text-white mb-1">✍🏼 Examiner Feedback (রিপোর্ট):</div>
              <div>{assessment.feedback_bn}</div>
            </div>
          </div>

          {/* RAG Next Session STUDY PLAN */}
          {ragSessionData && (
            <div className="card-card p-6 bg-slate-900/60 border border-white/10 shadow-xl">
              <h3 className="card-title text-indigo-400 mb-4 flex items-center gap-2 border-b border-white/5 pb-2">
                <span>📚</span> Next Session Guide (RAG-ভিত্তিক কাস্টম স্টাডি প্ল্যান)
              </h3>
              
              {/* Custom formatted AI instructions */}
              <div
                className="prose prose-indigo max-w-none text-sm text-slate-300 leading-relaxed space-y-4"
                style={{ whiteSpace: 'pre-line' }}
              >
                {ragSessionData}
              </div>
            </div>
          )}

          <div className="flex gap-4 justify-center">
            <button onClick={() => navigate('/curriculum')} className="glass-button" style={{ width: 'auto' }}>
              Return to Curriculum
            </button>
            <button onClick={() => navigate('/progress')} className="secondary-button" style={{ width: 'auto', padding: '0.85rem 1.25rem', borderRadius: '0.75rem' }}>
              View My Badges & XP 📈
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

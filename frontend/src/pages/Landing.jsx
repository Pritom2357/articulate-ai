import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { 
  Sparkles, 
  Mic, 
  Play, 
  BookOpen, 
  Layers, 
  BarChart2, 
  Trophy, 
  Bookmark, 
  ArrowRight, 
  CheckCircle, 
  ChevronRight, 
  Volume2, 
  Award,
  Star,
  Shield,
  MessageSquare
} from 'lucide-react';

// Simulated interactive conversation scenarios
const SCENARIOS = [
  {
    title: "IELTS Speaking Part 1",
    tutorName: "Riya (AI Tutor)",
    tutorLine: "Let's talk about your hometown. What is the most interesting part of your town?",
    studentLine: "Well, I would say the most fascinating part is the historic district. It has vintage architecture and vibrant local markets that come alive at night.",
    scores: { fluency: 8.5, grammar: 8.0, vocab: 8.5, pron: 8.5, overall: 8.5 },
    feedback: "Excellent use of descriptive vocabulary ('fascinating', 'vintage', 'vibrant'). Great grammatical range with minor prepositions."
  },
  {
    title: "Job Interview Practice",
    tutorName: "Rohit (AI Interviewer)",
    tutorLine: "Can you tell me about a time you had to deal with a conflict in your team?",
    studentLine: "Certainly. In my last project, we disagreed on design directions. I scheduled a quick meeting to listen to all views, and we eventually reached a consensus by merging the best ideas.",
    scores: { fluency: 9.0, grammar: 8.5, vocab: 8.0, pron: 8.5, overall: 8.5 },
    feedback: "Strong structured answer (STAR method). Pronunciation was very clear. 'Certainly' and 'Consensus' were highlighted as high-impact words."
  },
  {
    title: "Daily Cafe Conversation",
    tutorName: "Riya (AI Friend)",
    tutorLine: "Hi there! What can I get started for you today?",
    studentLine: "Hi! I would like to get a medium size iced caramel macchiato with oat milk, and a warm chocolate croissant, please.",
    scores: { fluency: 9.5, grammar: 9.0, vocab: 8.0, pron: 9.0, overall: 9.0 },
    feedback: "Flawless daily speech rhythm! Perfect pronunciation of 'macchiato' and 'croissant'. Natural conversational speed."
  }
];

export default function Landing() {
  const { user } = useAuth();
  const [activeScenarioIdx, setActiveScenarioIdx] = useState(0);
  const scenario = SCENARIOS[activeScenarioIdx];

  // Simulation states
  const [tutorText, setTutorText] = useState("");
  const [studentText, setStudentText] = useState("");
  const [simulationState, setSimulationState] = useState("tutor-typing"); // tutor-typing, tutor-idle, student-speaking, assessing, idle
  const [simulatedScores, setSimulatedScores] = useState({ fluency: 0, grammar: 0, vocab: 0, pron: 0, overall: 0 });

  // Typewriting effect simulator
  useEffect(() => {
    let timer;
    if (simulationState === "tutor-typing") {
      setTutorText("");
      setStudentText("");
      setSimulatedScores({ fluency: 0, grammar: 0, vocab: 0, pron: 0, overall: 0 });
      let currentLength = 0;
      const textToType = scenario.tutorLine;
      
      const type = () => {
        if (currentLength < textToType.length) {
          setTutorText(textToType.substring(0, currentLength + 1));
          currentLength++;
          timer = setTimeout(type, 30);
        } else {
          setSimulationState("tutor-idle");
        }
      };
      type();
    } else if (simulationState === "tutor-idle") {
      // Wait 1.5 seconds before student starts speaking
      timer = setTimeout(() => {
        setSimulationState("student-speaking");
      }, 1500);
    } else if (simulationState === "student-speaking") {
      let currentLength = 0;
      const textToType = scenario.studentLine;
      
      const type = () => {
        if (currentLength < textToType.length) {
          setStudentText(textToType.substring(0, currentLength + 1));
          currentLength++;
          timer = setTimeout(type, 35);
        } else {
          setSimulationState("assessing");
        }
      };
      type();
    } else if (simulationState === "assessing") {
      // Animate scores counting up
      let currentScore = 0.0;
      const targetOverall = scenario.scores.overall;
      const interval = setInterval(() => {
        if (currentScore < targetOverall) {
          currentScore += 0.5;
          setSimulatedScores({
            fluency: Math.min(scenario.scores.fluency, currentScore),
            grammar: Math.min(scenario.scores.grammar, currentScore),
            vocab: Math.min(scenario.scores.vocab, currentScore),
            pron: Math.min(scenario.scores.pron, currentScore),
            overall: Math.min(targetOverall, currentScore)
          });
        } else {
          setSimulatedScores(scenario.scores);
          clearInterval(interval);
          setSimulationState("idle");
        }
      }, 100);
    }

    return () => clearTimeout(timer);
  }, [simulationState, activeScenarioIdx]);

  // Restart simulation when scenario changes
  const handleScenarioChange = (idx) => {
    setActiveScenarioIdx(idx);
    setSimulationState("tutor-typing");
  };

  return (
    <div className="landing-layout bg-[#0b0f19] text-white min-h-screen font-sans relative overflow-x-hidden">
      
      {/* Inline styles for custom premium animations */}
      <style>{`
        @keyframes float-shape {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        @keyframes wave-bounce {
          0%, 100% { height: 8px; }
          50% { height: 32px; }
        }
        .animate-float-slow-1 {
          animation: float-shape 25s infinite ease-in-out;
        }
        .animate-float-slow-2 {
          animation: float-shape 20s infinite ease-in-out alternate;
        }
        .waveform-bar {
          width: 3px;
          border-radius: 99px;
          background: linear-gradient(to top, #4f46e5, #06b6d4);
          transition: height 0.15s ease-in-out;
        }
        .gradient-border-card {
          position: relative;
          background: rgba(17, 24, 39, 0.6);
          border-radius: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .gradient-border-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 1.5rem;
          padding: 1px;
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(6, 182, 212, 0.2), transparent);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .gradient-border-card:hover {
          transform: translateY(-5px);
          border-color: rgba(255, 255, 255, 0.12);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }
        .brand-glow {
          text-shadow: 0 0 20px rgba(6, 182, 212, 0.4);
        }
      `}</style>

      {/* Background Glowing Blobs */}
      <div className="absolute top-0 left-0 w-full h-[800px] overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-600/30 to-cyan-500/20 blur-[120px] animate-float-slow-1"></div>
        <div className="absolute top-[40%] right-[-5%] w-[450px] h-[450px] rounded-full bg-gradient-to-br from-pink-600/20 to-purple-500/20 blur-[100px] animate-float-slow-2"></div>
      </div>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#0b0f19]/70 backdrop-blur-xl border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎙️</span>
          <span className="text-xl font-black tracking-tight flex items-center">
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Articulate</span>
            <span className="mx-1 text-cyan-400 font-bold">•</span>
            <span className="bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">AI</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#simulator" className="hover:text-white transition-colors">Tutor Live Demo</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#testimonials" className="hover:text-white transition-colors">Success Stories</a>
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <Link 
              to="/curriculum" 
              className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm py-2 px-5 rounded-xl transition-all shadow-[0_4px_15px_rgba(6,182,212,0.2)] hover:scale-105"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/login" 
                className="text-slate-300 hover:text-white text-sm font-semibold px-3 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm py-2.5 px-5 rounded-xl transition-all shadow-[0_4px_15px_rgba(6,182,212,0.2)] hover:scale-105"
              >
                Get Started Free
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-24 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        {/* Hero Left Content */}
        <div className="lg:col-span-6 space-y-8 text-left">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-3.5 py-1.5 rounded-full text-xs font-bold text-indigo-300">
            <Sparkles size={14} className="text-cyan-400" />
            AI-Powered Speaking Coach for Fluent English
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Speak English <br />
            <span className="bg-gradient-to-r from-indigo-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">
              With Confidence
            </span>
          </h1>

          <p className="text-slate-400 text-base md:text-lg leading-relaxed max-w-xl">
            Stuck in English speaking fluency or preparing for the IELTS Speaking test? Practice with interactive voice AI tutors, get native-level guidance, and build your vocabulary vocabulary path.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            {user ? (
              <Link 
                to="/curriculum" 
                className="bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-600 bg-size-200 text-white font-black py-4 px-8 rounded-2xl transition-all hover:scale-[1.03] text-center shadow-[0_8px_25px_rgba(79,70,229,0.35)] flex items-center justify-center gap-2 group"
              >
                Open Curriculum <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link 
                  to="/register" 
                  className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-black py-4 px-8 rounded-2xl transition-all hover:scale-[1.03] text-center shadow-[0_8px_25px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 group"
                >
                  Start Practicing Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link 
                  to="/login" 
                  className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-bold py-4 px-8 rounded-2xl transition-all hover:scale-[1.02] text-center"
                >
                  Sign In to Account
                </Link>
              </>
            )}
          </div>

          {/* Quick Stats/Badges */}
          <div className="grid grid-cols-3 gap-6 pt-6 border-t border-white/5 max-w-md">
            <div>
              <div className="text-2xl font-black text-white">95%</div>
              <div className="text-xs text-slate-500 mt-1">Fluency Improvement</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">8.5+</div>
              <div className="text-xs text-slate-500 mt-1">Avg. IELTS Target</div>
            </div>
            <div>
              <div className="text-2xl font-black text-white">24/7</div>
              <div className="text-xs text-slate-500 mt-1">Instant Tutor Access</div>
            </div>
          </div>
        </div>

        {/* Hero Right: Live Interactive Speak Simulator */}
        <div id="simulator" className="lg:col-span-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative">
            
            {/* Header / Simulator Controls */}
            <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">AI Speaking Simulator</span>
              </div>
              <div className="flex gap-1.5">
                {SCENARIOS.map((scen, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleScenarioChange(idx)}
                    className={`text-[10px] md:text-xs font-bold py-1 px-2.5 rounded-lg transition-all ${activeScenarioIdx === idx ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                  >
                    Scenario {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Live Chat Log Area */}
            <div className="space-y-4 min-h-[190px] flex flex-col justify-start">
              
              {/* Tutor Dialog Box */}
              <div className="flex gap-3.5 items-start">
                <div className="w-9 h-9 rounded-full bg-indigo-600/30 flex items-center justify-center font-bold text-sm text-indigo-300 border border-indigo-500/20 shrink-0">
                  🤖
                </div>
                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3.5 max-w-[85%] text-left text-sm text-slate-200">
                  <div className="text-[10px] font-black text-indigo-400 uppercase tracking-wider mb-1">
                    {scenario.tutorName}
                  </div>
                  {tutorText || <span className="opacity-40 italic">Waiting...</span>}
                </div>
              </div>

              {/* Student Answer Box */}
              {(studentText || simulationState === "student-speaking" || simulationState === "tutor-idle") && (
                <div className="flex gap-3.5 items-start justify-end">
                  <div className="bg-gradient-to-r from-indigo-900/50 to-cyan-900/50 border border-indigo-500/20 rounded-2xl rounded-tr-none p-3.5 max-w-[85%] text-left text-sm text-slate-200">
                    <div className="text-[10px] font-black text-cyan-400 uppercase tracking-wider mb-1 flex justify-between items-center gap-3">
                      <span>You (Speaking)</span>
                      {simulationState === "student-speaking" && <span className="text-rose-400 font-bold animate-pulse">● REC</span>}
                    </div>
                    {studentText || (
                      <div className="flex items-center gap-1.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    )}
                  </div>
                  <div className="w-9 h-9 rounded-full bg-cyan-600/30 flex items-center justify-center font-bold text-sm text-cyan-300 border border-cyan-500/20 shrink-0">
                    🎙️
                  </div>
                </div>
              )}
            </div>

            {/* Waveform / Visual Audio Activity Indicator */}
            <div className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 my-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Mic size={14} className="text-cyan-400" />
                <span>
                  {simulationState === "tutor-typing" && "Tutor is talking..."}
                  {simulationState === "tutor-idle" && "Get ready..."}
                  {simulationState === "student-speaking" && "Speaking now..."}
                  {simulationState === "assessing" && "Analyzing speech..."}
                  {simulationState === "idle" && "Simulation finished"}
                </span>
              </div>

              {/* Animated wave bars */}
              <div className="flex items-center gap-[3px] h-8">
                {[...Array(14)].map((_, i) => {
                  let bounceStyle = {};
                  if (simulationState === "student-speaking") {
                    const duration = 0.5 + Math.random() * 0.6;
                    const delay = Math.random() * 0.5;
                    bounceStyle = {
                      animation: `wave-bounce ${duration}s infinite ease-in-out alternate`,
                      animationDelay: `${delay}s`
                    };
                  } else if (simulationState === "tutor-typing") {
                    const duration = 0.7 + Math.random() * 0.5;
                    const delay = Math.random() * 0.4;
                    bounceStyle = {
                      animation: `wave-bounce ${duration}s infinite ease-in-out alternate`,
                      animationDelay: `${delay}s`,
                      background: 'linear-gradient(to top, #4f46e5, #ec4899)'
                    };
                  } else {
                    bounceStyle = { height: '6px' };
                  }
                  return <div key={i} className="waveform-bar" style={bounceStyle} />;
                })}
              </div>
            </div>

            {/* AI Coaching Feedback & Scores */}
            <div className="grid grid-cols-5 gap-2.5 mb-4">
              {[
                { label: "Fluency", val: simulatedScores.fluency },
                { label: "Grammar", val: simulatedScores.grammar },
                { label: "Vocab", val: simulatedScores.vocab },
                { label: "Pronunciation", val: simulatedScores.pron },
                { label: "IELTS Score", val: simulatedScores.overall, highlight: true }
              ].map((sc, i) => (
                <div 
                  key={i} 
                  className={`rounded-xl p-2 text-center transition-all ${
                    sc.highlight 
                      ? 'bg-gradient-to-br from-indigo-900/40 to-cyan-900/40 border border-indigo-500/30' 
                      : 'bg-white/3 border border-white/5'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 font-bold">{sc.label}</div>
                  <div className={`text-sm md:text-base font-black mt-1 ${sc.highlight ? 'text-cyan-400' : 'text-slate-100'}`}>
                    {sc.val > 0 ? sc.val.toFixed(1) : "—"}
                  </div>
                </div>
              ))}
            </div>

            {/* Suggestion Card */}
            {simulationState === "idle" && (
              <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-xl p-3.5 text-left text-xs text-indigo-200 flex items-start gap-2.5 animate-fade-in">
                <Sparkles size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-300 block mb-0.5">AI Feedback:</span>
                  {scenario.feedback}
                </div>
              </div>
            )}

            {/* Restart Button */}
            {simulationState === "idle" && (
              <button
                onClick={() => setSimulationState("tutor-typing")}
                className="mt-4 w-full bg-white/5 hover:bg-white/10 text-white font-bold text-xs py-2.5 px-4 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-1.5"
              >
                <Play size={12} fill="white" /> Replay Current Simulation
              </button>
            )}

          </div>
        </div>
      </section>

      {/* Feature Showcase Grid Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24 border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Everything you need to master English
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            Engineered with deep learning model integration to target fluency, accent, spelling, and vocabulary acquisition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Card 1 */}
          <div className="gradient-border-card p-8 flex flex-col items-start text-left">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-indigo-400 mb-6">
              <Sparkles size={24} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Interactive AI Tutors</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Hold real conversations with Riya (Female) or Rohit (Male) tutors, toggling language accents and receiving interactive feedback.
            </p>
            <span className="text-indigo-400 font-bold text-xs flex items-center gap-1 mt-auto">
              Real-time voice synthesis <ChevronRight size={14} />
            </span>
          </div>

          {/* Card 2 */}
          <div className="gradient-border-card p-8 flex flex-col items-start text-left">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 mb-6">
              <Mic size={24} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">IELTS Mock Speaking Tests</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Take formal IELTS Speaking module tests. Our AI evaluates your fluency, coherence, grammar range, and lexicon immediately.
            </p>
            <span className="text-cyan-400 font-bold text-xs flex items-center gap-1 mt-auto">
              Band score approximation <ChevronRight size={14} />
            </span>
          </div>

          {/* Card 3 */}
          <div className="gradient-border-card p-8 flex flex-col items-start text-left">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/25 flex items-center justify-center text-pink-400 mb-6">
              <BookOpen size={24} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Interactive Curriculum</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Follow a organized pathway divided into Chapters, Lessons, and targeted Vocabulary exercises to systematically improve.
            </p>
            <span className="text-pink-400 font-bold text-xs flex items-center gap-1 mt-auto">
              Structured learning paths <ChevronRight size={14} />
            </span>
          </div>

          {/* Card 4 */}
          <div className="gradient-border-card p-8 flex flex-col items-start text-left">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center text-purple-400 mb-6">
              <Layers size={24} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">3D Vocabulary Flashcards</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Memorize new words using beautiful 3D flipcards. Check definitions, Bangla context meanings, and hear native audio.
            </p>
            <span className="text-purple-400 font-bold text-xs flex items-center gap-1 mt-auto">
              Active recall training <ChevronRight size={14} />
            </span>
          </div>

          {/* Card 5 */}
          <div className="gradient-border-card p-8 flex flex-col items-start text-left">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mb-6">
              <BarChart2 size={24} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Detailed Progress Tracking</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Track your daily learning streak, study session minutes, total sentences spoken, and vocabulary counts over beautiful charts.
            </p>
            <span className="text-emerald-400 font-bold text-xs flex items-center gap-1 mt-auto">
              Daily streaks & stats <ChevronRight size={14} />
            </span>
          </div>

          {/* Card 6 */}
          <div className="gradient-border-card p-8 flex flex-col items-start text-left">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 mb-6">
              <Trophy size={24} />
            </div>
            <h3 className="text-lg font-black text-white mb-2">Leaderboard Competitions</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Earn experience points (XP) for lessons and chat practice. Compete with global students to stay highly motivated.
            </p>
            <span className="text-amber-400 font-bold text-xs flex items-center gap-1 mt-auto">
              Global student ranks <ChevronRight size={14} />
            </span>
          </div>

        </div>
      </section>

      {/* How it Works / Onboarding Steps */}
      <section id="how-it-works" className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24 bg-white/2 rounded-3xl border border-white/5 my-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            How your journey unfolds
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            From your first baseline assessment to complete native conversational capability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="text-left space-y-4">
            <div className="text-4xl font-black text-indigo-500/40">01</div>
            <h4 className="text-lg font-black text-white">Placement Test</h4>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
              Complete a 5-minute diagnostic test upon onboarding. Our engine calculates your baseline pronunciation and grammar score.
            </p>
          </div>

          <div className="text-left space-y-4">
            <div className="text-4xl font-black text-cyan-500/40">02</div>
            <h4 className="text-lg font-black text-white">Curriculum Pathway</h4>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
              Unlock Chapters matching your skill tier. Work through interactive audio lessons translating vocabulary and phrases.
            </p>
          </div>

          <div className="text-left space-y-4">
            <div className="text-4xl font-black text-pink-500/40">03</div>
            <h4 className="text-lg font-black text-white">AI Conversations</h4>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
              Engage with Riya or Rohit in situational scenarios. Talk using your device microphone and receive targeted IELTS corrections.
            </p>
          </div>

          <div className="text-left space-y-4">
            <div className="text-4xl font-black text-purple-500/40">04</div>
            <h4 className="text-lg font-black text-white">Scale and Fluency</h4>
            <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
              Review your personalized mistakes stack in your Vocabulary bank, unlock leaderboard badges, and elevate your English fluency.
            </p>
          </div>

        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 py-24 border-t border-white/5">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
            Trusted by students worldwide
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            Hear from students who built confidence and achieved their target scores.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="bg-slate-900/40 border border-white/5 p-8 rounded-2xl text-left flex flex-col justify-between">
            <div className="flex gap-1 text-amber-400 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
            </div>
            <p className="text-slate-300 text-sm italic leading-relaxed mb-6">
              "The IELTS mock test is spot on. I practiced for 3 weeks with Rohit before my actual test. The AI predicted my score as 7.5, and I ended up getting exactly a 7.5 in the actual speaking component!"
            </p>
            <div>
              <div className="text-sm font-bold text-white">Tanvir Rahman</div>
              <div className="text-[11px] text-slate-500 mt-0.5">IELTS Aspirant, Dhaka</div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 p-8 rounded-2xl text-left flex flex-col justify-between">
            <div className="flex gap-1 text-amber-400 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
            </div>
            <p className="text-slate-300 text-sm italic leading-relaxed mb-6">
              "I used to feel extremely nervous whenever I had to speak in client meetings. Having Riya available to converse with 24/7 removed all my speaking anxiety. My communication speed has doubled!"
            </p>
            <div>
              <div className="text-sm font-bold text-white">Nabila Islam</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Software Engineer, Sylhet</div>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-white/5 p-8 rounded-2xl text-left flex flex-col justify-between">
            <div className="flex gap-1 text-amber-400 mb-4">
              {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
            </div>
            <p className="text-slate-300 text-sm italic leading-relaxed mb-6">
              "The vocabulary flashcards with Bangla translation and audio are incredibly useful. The spaced repetition really helps retain words. Highly recommended platform for all levels!"
            </p>
            <div>
              <div className="text-sm font-bold text-white">Rakib Hasan</div>
              <div className="text-[11px] text-slate-500 mt-0.5">University Student, Chittagong</div>
            </div>
          </div>

        </div>
      </section>

      {/* Pricing / Call To Action Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 py-16 mb-24">
        <div className="bg-gradient-to-tr from-indigo-950/40 via-cyan-950/20 to-slate-900/50 border border-indigo-500/20 rounded-3xl p-8 md:p-16 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-[-20%] right-[-10%] w-80 h-80 bg-cyan-500/10 blur-[80px] rounded-full"></div>
          
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4 relative z-10">
            Ready to speak fluent English?
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-xl mx-auto mb-8 relative z-10">
            Join thousands of learners who are mastering their spoken English path. Start practicing for free today.
          </p>

          <div className="flex justify-center relative z-10">
            {user ? (
              <Link 
                to="/curriculum" 
                className="bg-gradient-to-r from-indigo-600 via-cyan-600 to-indigo-600 bg-size-200 text-white font-black py-4 px-10 rounded-2xl transition-all hover:scale-[1.03] text-center shadow-[0_8px_25px_rgba(79,70,229,0.35)] flex items-center justify-center gap-2 group"
              >
                Go to Dashboard <ArrowRight size={18} />
              </Link>
            ) : (
              <Link 
                to="/register" 
                className="bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-black py-4 px-10 rounded-2xl transition-all hover:scale-[1.03] text-center shadow-[0_8px_25px_rgba(79,70,229,0.3)] flex items-center justify-center gap-2 group"
              >
                Start Practicing Free <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#070a12] border-t border-white/5 py-12 px-6 md:px-12 relative z-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎙️</span>
              <span className="text-base font-black tracking-tight">Articulate·AI</span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-xs">
              Articulate AI is a professional language development app leveraging state of the art AI voice synthesis to provide native-level English learning.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-4">Product</h5>
            <ul className="space-y-2.5 text-xs text-slate-500">
              <li><a href="#features" className="hover:text-white transition-colors">AI Tutors</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">IELTS Speaking</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Flashcards</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-4">Resources</h5>
            <ul className="space-y-2.5 text-xs text-slate-500">
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">English Vocabulary</a></li>
              <li><a href="#" className="hover:text-white transition-colors">IELTS Tips</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-4">Safety & Privacy</h5>
            <ul className="space-y-2.5 text-xs text-slate-500">
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Data Safety</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Preferences</a></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <div>© {new Date().getFullYear()} Articulate AI. All rights reserved.</div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1"><Shield size={12} /> Privacy Protected</span>
            <span className="flex items-center gap-1"><Award size={12} /> AI Quality Verified</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

import { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { updateProfile } from '../api/user.js';
import { getNotifications } from '../api/progress.js';
import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articucate_female.jpeg';
import { BookOpen, Layers, BarChart2, User, Sparkles, ClipboardList, Bell, LogOut, Key, Bookmark, Trophy, Search, X, Loader } from 'lucide-react';
import { searchCurriculum } from '../api/curriculum.js';


function AnimatedBrandText({ text, baseDelay = 0, className = "" }) {
  return (
    <span className={className}>
      {text.split('').map((char, index) => (
        <span 
          key={index} 
          className="brand-letter" 
          style={{ animationDelay: `${baseDelay + index * 0.04}s` }}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

function SidebarBrand() {
  return (
    <div className="sidebar-brand">
      <Link to="/" className="brand-logo">
        <div className="brand-icon">🎙️</div>
        <div>
          <div className="brand-name">
            <AnimatedBrandText text="Articulate" baseDelay={0} className="brand-word brand-word-articulate" />
            <span className="brand-dot">·</span>
            <AnimatedBrandText text="AI" baseDelay={0.4} className="brand-word brand-word-ai" />
          </div>
          <div className="brand-tagline">English Learning Platform</div>
        </div>
      </Link>
    </div>
  );
}

function GuideIndicator({ user, onUpdate }) {
  const isFemale = user.guide_preference === 'FEMALE';
  const avatarImg = isFemale ? femaleAvatar : maleAvatar;
  
  return (
    <div className="bg-white/3 rounded-xl p-3 mb-4 mt-2 border border-white/5 text-xs">
      <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-300">
        <span>🤖</span> Active Tutor:
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-500/30 shadow-sm">
            <img src={avatarImg} alt="Tutor" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-semibold text-white">{isFemale ? 'Riya (রিয়া)' : 'Rohit (রোহিত)'}</div>
            <div className="text-slate-400 font-medium">{isFemale ? 'Female Guide' : 'Male Guide'}</div>
          </div>
        </div>
        <button
          onClick={() => onUpdate(isFemale ? 'MALE' : 'FEMALE')}
          className="text-indigo-400 hover:text-indigo-300 font-bold border-none bg-transparent cursor-pointer transition-colors"
        >
          Change
        </button>
      </div>
    </div>
  );
}

function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        setIsSearching(true);
        const data = await searchCurriculum(query);
        setResults(data);
      } catch (err) {
        setResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleResultClick = (path) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative mb-4 px-2">
      <div className={`flex items-center bg-slate-900/50 border ${isOpen ? 'border-indigo-500/50' : 'border-white/10'} rounded-xl px-3 py-2 transition-all`}>
        <Search size={16} className="text-slate-400 mr-2" />
        <input
          type="text"
          placeholder="Search lessons, words..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="bg-transparent border-none text-white text-sm w-full outline-none placeholder:text-slate-500"
        />
        {query && (
          <button onClick={() => { setQuery(''); setResults(null); }} className="text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute z-50 left-2 right-2 top-full mt-2 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto custom-scrollbar p-2">
          {isSearching ? (
            <div className="py-4 text-center text-slate-400 flex justify-center items-center gap-2 text-sm">
              <Loader size={14} className="animate-spin" /> Searching...
            </div>
          ) : results && (results.lessons?.length || results.words?.length || results.phrases?.length) ? (
            <div className="space-y-3">
              {results.lessons?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 px-2">Lessons</div>
                  {results.lessons.slice(0, 3).map(lesson => (
                    <div key={lesson.id} onClick={() => handleResultClick(`/lessons/${lesson.id}`)} className="p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
                      <div className="text-sm font-bold text-indigo-300 group-hover:text-indigo-200">{lesson.title}</div>
                      <div className="text-xs text-slate-400 truncate">{lesson.objective_bn || lesson.title_bn}</div>
                    </div>
                  ))}
                </div>
              )}
              {results.words?.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 px-2">Words</div>
                  {results.words.slice(0, 5).map(word => (
                    <div key={word.id} onClick={() => handleResultClick(`/words/${word.id}`)} className="p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors flex justify-between items-center group">
                      <div className="text-sm font-bold text-cyan-300 group-hover:text-cyan-200">{word.word}</div>
                      <div className="text-xs text-slate-400">{word.bangla_meaning}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-slate-500 text-sm italic">
              কোনো ফলাফল পাওয়া যায়নি।
            </div>
          )}
        </div>
      )}
      
      {/* Click outside overlay */}
      {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>}
    </div>
  );
}

export default function Layout() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    async function fetchUnread() {
      try {
        const notifications = await getNotifications();
        const readIds = JSON.parse(localStorage.getItem('read_notification_ids') || '[]');
        const clearedIds = JSON.parse(localStorage.getItem('cleared_notification_ids') || '[]');
        
        // Filter out cleared ones
        const activeNotifs = notifications.filter(n => !clearedIds.includes(n.id));

        if (location.pathname === '/notifications') {
          const newReadIds = Array.from(new Set([...readIds, ...activeNotifs.map(n => n.id)]));
          localStorage.setItem('read_notification_ids', JSON.stringify(newReadIds));
          setUnreadCount(0);
        } else {
          const unread = activeNotifs.filter(n => !readIds.includes(n.id));
          setUnreadCount(unread.length);
        }
      } catch (err) {
        console.error('Failed to fetch notifications for badge:', err);
      }
    }

    fetchUnread();

    const interval = setInterval(fetchUnread, 30000);
    window.addEventListener('notifications_updated', fetchUnread);

    return () => {
      clearInterval(interval);
      window.removeEventListener('notifications_updated', fetchUnread);
    };
  }, [user, location.pathname]);

  // Active Screen Time tracking (runs globally under Layout shell)
  useEffect(() => {
    if (!user) return;

    let activeStartTime = Date.now();
    let isWindowFocused = true;

    const getTodayKey = () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const updateScreenTime = () => {
      const now = Date.now();
      const diffSeconds = Math.round((now - activeStartTime) / 1000);
      if (diffSeconds <= 0) return;

      activeStartTime = now; // Reset timer anchor

      const storageKey = 'articulate_screen_time';
      const rawData = localStorage.getItem(storageKey);
      let data = {};
      try {
        if (rawData) data = JSON.parse(rawData);
      } catch (e) {
        console.error('Failed to parse screen time data', e);
      }

      const today = getTodayKey();
      data[today] = (data[today] || 0) + diffSeconds;
      localStorage.setItem(storageKey, JSON.stringify(data));
    };

    const handleFocus = () => {
      if (!isWindowFocused) {
        isWindowFocused = true;
        activeStartTime = Date.now();
      }
    };

    const handleBlur = () => {
      if (isWindowFocused) {
        updateScreenTime();
        isWindowFocused = false;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBlur();
      } else {
        handleFocus();
      }
    };

    // Periodically update active time every 10 seconds
    const interval = setInterval(() => {
      if (isWindowFocused && !document.hidden) {
        updateScreenTime();
      }
    }, 10000);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      updateScreenTime(); // Save final session slice on component unmount
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user]);


  async function handleToggleGuide(newGuide) {
    try {
      await updateProfile(user.id, { guide_preference: newGuide });
      await refreshUser();
    } catch (err) {
      console.error('Failed to update guide preference:', err);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="site-sidebar">
        <SidebarBrand />

        {user && <GuideIndicator user={user} onUpdate={handleToggleGuide} />}
        {user && <GlobalSearch />}

        <nav className="sidebar-nav">
          <div className="nav-section-label">Learn</div>
          <NavLink to="/curriculum" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><BookOpen size={16} /></span> Curriculum
          </NavLink>
          <NavLink to="/flashcards" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><Layers size={16} /></span> Flashcards
          </NavLink>
          <NavLink to="/progress" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><BarChart2 size={16} /></span> My Progress
          </NavLink>
          <NavLink to="/leaderboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><Trophy size={16} /></span> Leaderboard
          </NavLink>
          <NavLink to="/vocabulary" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><Bookmark size={16} /></span> My Vocabulary
          </NavLink>
          <NavLink to="/onboarding" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><ClipboardList size={16} /></span> Placement Test
          </NavLink>

          {user && (
            <>
              <div className="nav-section-label" style={{ marginTop: '0.5rem' }}>AI Assistant</div>
              <NavLink to="/ai-chat" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <span className="nav-icon"><Sparkles size={16} /></span> AI Chat
              </NavLink>
              <NavLink to="/tests" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <span className="nav-icon"><ClipboardList size={16} /></span> Tests
              </NavLink>
              <NavLink to="/notifications" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <span className="nav-icon" style={{ position: 'relative' }}>
                  <Bell size={16} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                </span>
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="ml-auto bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                    {unreadCount}
                  </span>
                )}
              </NavLink>

              <div className="nav-section-label" style={{ marginTop: '0.5rem' }}>Account</div>
              <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <span className="nav-icon"><User size={16} /></span> Profile
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <button className="nav-button" onClick={handleLogout}>
              <span className="nav-icon"><LogOut size={16} /></span> Sign out
            </button>
          ) : (
            <Link to="/login" className="nav-link" style={{ display: 'flex', gap: '0.75rem', padding: '0.65rem 0.75rem' }}>
              <span className="nav-icon"><Key size={16} /></span> Sign in
            </Link>
          )}
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
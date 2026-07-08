import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { updateProfile } from '../api/user.js';
import { getUnreadNotificationCount } from '../api/progress.js';
import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articulate_female.jpeg';
import { BookOpen, Layers, BarChart2, User, Sparkles, ClipboardList, Bell, LogOut, Key, Bookmark, Trophy, Search, X, Loader, Sun, Moon, Globe, LayoutDashboard, Menu } from 'lucide-react';
import { searchCurriculum } from '../api/curriculum.js';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';
import FloatingAssistant from './FloatingAssistant.jsx';


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
      <Link to="/dashboard" className="brand-logo">
        <div className="brand-icon"><Sparkles size={18} className="text-indigo-400" /></div>
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
  const { t, language } = useThemeLanguage();
  const isFemale = user.guide_preference === 'FEMALE';
  const avatarImg = isFemale ? femaleAvatar : maleAvatar;

  return (
    <div className="bg-white/3 rounded-xl p-3 mb-4 mt-2 border border-white/5 text-xs">
      <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-300">
        <User size={12} className="text-indigo-400" /> {t('nav_active_tutor')}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-500/30 shadow-sm">
            <img src={avatarImg} alt="Tutor" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-semibold text-white">
              {isFemale 
                ? (language === 'bn' ? 'Riya (রিয়া)' : 'Riya') 
                : (language === 'bn' ? 'Rohit (রোহিত)' : 'Rohit')}
            </div>
            <div className="text-slate-400 font-medium">{isFemale ? t('nav_tutor_female') : t('nav_tutor_male')}</div>
          </div>
        </div>
        <button
          onClick={() => onUpdate(isFemale ? 'MALE' : 'FEMALE')}
          className="text-indigo-400 hover:text-indigo-300 font-bold border-none bg-transparent cursor-pointer transition-colors"
        >
          {t('nav_change')}
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
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { t, language } = useThemeLanguage();

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
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // When the modal opens: focus the input, lock body scroll, close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleResultClick = (path) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
    setResults(null);
  };

  const hasResults = results && (results.lessons?.length || results.words?.length || results.phrases?.length);

  return (
    <>
      {/* Trigger — styled like a search field, opens the modal on click */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="search-trigger"
        aria-label={t('nav_search')}
      >
        <Search size={16} className="text-slate-400 shrink-0" />
        <span className="search-trigger-text">{t('nav_search')}</span>
      </button>

      {isOpen && (
        <div className="search-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="search-modal-input-row">
              <Search size={18} className="text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder={t('nav_search')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-modal-input"
              />
              {isSearching && <Loader size={16} className="animate-spin text-slate-400 shrink-0" />}
              {query && !isSearching && (
                <button onClick={() => { setQuery(''); setResults(null); inputRef.current?.focus(); }} className="text-slate-400 hover:text-white shrink-0" aria-label="Clear">
                  <X size={16} />
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="search-modal-close" aria-label="Close search">
                <X size={18} />
              </button>
            </div>

            <div className="search-modal-results">
              {!query.trim() ? (
                <div className="py-10 text-center text-slate-500 text-sm">
                  {language === 'bn' ? 'লেসন বা শব্দ খুঁজতে টাইপ করুন…' : 'Type to search lessons and words…'}
                </div>
              ) : isSearching && !hasResults ? (
                <div className="py-10 text-center text-slate-400 flex justify-center items-center gap-2 text-sm">
                  <Loader size={16} className="animate-spin" /> {language === 'bn' ? 'খুঁজছি…' : 'Searching…'}
                </div>
              ) : hasResults ? (
                <div className="space-y-4">
                  {results.lessons?.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 px-2 tracking-wider">{language === 'bn' ? 'লেসন' : 'Lessons'}</div>
                      {results.lessons.slice(0, 4).map(lesson => (
                        <div key={lesson.id} onClick={() => handleResultClick(`/lessons/${lesson.id}`)} className="p-2.5 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group">
                          <div className="text-sm font-bold text-indigo-300 group-hover:text-indigo-200">
                            {language === 'bn' ? (lesson.title_bn || lesson.title) : lesson.title}
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            {language === 'bn' ? (lesson.objective_bn || lesson.title_bn) : 'Practice pronunciation and speaking.'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {results.words?.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 px-2 tracking-wider">{language === 'bn' ? 'শব্দ' : 'Words'}</div>
                      {results.words.slice(0, 8).map(word => (
                        <div key={word.id} onClick={() => handleResultClick(`/words/${word.id}`)} className="p-2.5 hover:bg-white/5 rounded-lg cursor-pointer transition-colors flex justify-between items-center gap-3 group">
                          <div className="text-sm font-bold text-cyan-300 group-hover:text-cyan-200">{word.word}</div>
                          <div className="text-xs text-slate-400 truncate">{word.bangla_meaning}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
            <div className="py-4 text-center text-slate-500 text-sm italic">
              {language === 'bn' ? 'কোনো ফলাফল পাওয়া যায়নি।' : 'No results found.'}
            </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Layout() {
  const { user, logout, refreshUser } = useAuth();
  const { theme, language, toggleTheme, toggleLanguage, t } = useThemeLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close the mobile drawer whenever the route changes (covers nav link taps too)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    async function fetchUnread() {
      try {
        const count = await getUnreadNotificationCount();
        setUnreadCount(count);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
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
    navigate('/');
  }

  return (
    <div className="app-shell">
      {/* Mobile drawer backdrop */}
      <div
        className={`sidebar-backdrop${sidebarOpen ? ' open' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`site-sidebar${sidebarOpen ? ' open' : ''}`}>
        <button
          className="sidebar-close-btn"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        <SidebarBrand />

        {user && <GuideIndicator user={user} onUpdate={handleToggleGuide} />}


        <nav className="sidebar-nav">
          {user && (
            <>
              <div className="nav-section-label">{language === 'bn' ? 'এআই অ্যাসিস্ট্যান্ট' : 'AI Assistant'}</div>
              <NavLink to="/ai-chat" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <span className="nav-icon"><Sparkles size={16} /></span> {t('nav_ai_chat')}
              </NavLink>
            </>
          )}

          <div className="nav-section-label" style={{ marginTop: user ? '0.5rem' : '0' }}>{language === 'bn' ? 'শিখুন' : 'Learn'}</div>
          <NavLink to="/curriculum" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><BookOpen size={16} /></span> {t('nav_curriculum')}
          </NavLink>
          <NavLink to="/progress" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><BarChart2 size={16} /></span> {t('nav_progress')}
          </NavLink>
          {user && (
            <>
              <NavLink to="/tests" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <span className="nav-icon"><ClipboardList size={16} /></span> {t('nav_tests')}
              </NavLink>
              <NavLink to="/onboarding" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <span className="nav-icon"><ClipboardList size={16} /></span> {t('nav_placement')}
              </NavLink>
            </>
          )}
          <NavLink to="/leaderboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><Trophy size={16} /></span> {t('nav_leaderboard')}
          </NavLink>
          <NavLink to="/flashcards" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><Layers size={16} /></span> {t('nav_flashcards')}
          </NavLink>
          <NavLink to="/vocabulary" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon"><Bookmark size={16} /></span> {t('nav_vocabulary')}
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <button className="nav-button" onClick={handleLogout}>
              <span className="nav-icon"><LogOut size={16} /></span> {t('nav_sign_out')}
            </button>
          ) : (
            <Link to="/login" className="nav-link" style={{ display: 'flex', gap: '0.75rem', padding: '0.65rem 0.75rem' }}>
              <span className="nav-icon"><Key size={16} /></span> {t('nav_sign_in')}
            </Link>
          )}
        </div>
      </aside>

      <main className="main-content">

        {/* Persistent Top Bar with Notifications & Profile */}
        <div className="top-bar">
          <div className="top-bar-left">
            <button
              className="sidebar-toggle-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>
          </div>

          <div className="top-bar-center">
            {/* Global Search Bar */}
            {user && <GlobalSearch />}
          </div>

          <div className="top-bar-actions">
            {/* Language Switcher */}
            <button 
              onClick={toggleLanguage} 
              className="top-bar-icon-btn font-extrabold text-xs" 
              title={language === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px', width: 'auto', borderRadius: '1rem' }}
            >
              <Globe size={14} className="text-indigo-400" />
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <span className={language === 'bn' ? 'text-white drop-shadow-md' : 'text-slate-500 hover:text-slate-300 transition-colors'}>বাং</span>
                <span className="text-white/20">|</span>
                <span className={language === 'en' ? 'text-white drop-shadow-md' : 'text-slate-500 hover:text-slate-300 transition-colors'}>EN</span>
              </div>
            </button>

            {/* Theme Switcher */}
            <button 
              onClick={toggleTheme} 
              className="top-bar-icon-btn" 
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-600" />}
            </button>

            {/* Notification Bell */}
            <Link to="/notifications" className="top-bar-icon-btn" title="Notifications">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="top-bar-badge">
                  <span className="top-bar-badge-ping"></span>
                  <span className="top-bar-badge-count">{unreadCount > 99 ? '99+' : unreadCount}</span>
                </span>
              )}
            </Link>

            {/* Profile Avatar */}
            {user ? (
              <Link to="/progress" className="top-bar-profile" title="Profile">
                {user.profile_photo ? (
                  <img src={user.profile_photo} alt={user.name} className="top-bar-avatar" />
                ) : (
                  <div className="top-bar-avatar-placeholder">
                    {user.name?.charAt(0)?.toUpperCase() || <User size={18} />}
                  </div>
                )}
              </Link>
            ) : (
              <Link to="/login" className="top-bar-icon-btn" title="Sign in">
                <User size={20} />
              </Link>
            )}
          </div>
        </div>


        <Outlet />
      </main>

      {location.pathname !== '/ai-chat' && <FloatingAssistant />}
    </div>
  );
}
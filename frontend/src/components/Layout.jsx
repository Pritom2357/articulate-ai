import { useState, useEffect } from 'react';
import { Outlet, Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { updateProfile } from '../api/user.js';
import { getNotifications } from '../api/progress.js';
import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articucate_female.jpeg';
import { BookOpen, Layers, BarChart2, User, Sparkles, ClipboardList, Bell, LogOut, Key } from 'lucide-react';


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
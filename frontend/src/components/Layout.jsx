import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { updateProfile } from '../api/user.js';
import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articucate_female.jpeg';

const ARTICULATE_LETTERS = ['A','R','T','I','C','U','L','A','T','E'];
const AI_LETTERS = ['A','I'];

function SidebarBrand() {
  return (
    <div className="sidebar-brand">
      <Link to="/" className="brand-logo">
        <div className="brand-icon">🎙️</div>
        <div>
          <div className="brand-name">
            <span className="brand-word brand-word-articulate">
              {ARTICULATE_LETTERS.map((l, i) => (
                <span key={i} className="brand-letter" style={{ animationDelay: `${i * 0.08}s` }}>{l}</span>
              ))}
            </span>
            <span className="brand-dot" style={{ animationDelay: '0.85s' }}>·</span>
            <span className="brand-word brand-word-ai">
              {AI_LETTERS.map((l, i) => (
                <span key={i} className="brand-letter" style={{ animationDelay: `${(ARTICULATE_LETTERS.length + i) * 0.08}s` }}>{l}</span>
              ))}
            </span>
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
    <div className="bg-slate-100 rounded-xl p-3 mb-4 mt-2 border border-slate-200/50 text-xs">
      <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-700">
        <span>🤖</span> Active Tutor:
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-indigo-500/20 shadow-sm">
            <img src={avatarImg} alt="Tutor" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="font-semibold text-slate-900">{isFemale ? 'Riya (রিয়া)' : 'Rohit (রোহিত)'}</div>
            <div className="text-slate-500 font-medium">{isFemale ? 'Female Guide' : 'Male Guide'}</div>
          </div>
        </div>
        <button
          onClick={() => onUpdate(isFemale ? 'MALE' : 'FEMALE')}
          className="text-indigo-600 hover:text-indigo-800 font-bold border-none bg-transparent cursor-pointer"
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
            <span className="nav-icon">📚</span> Curriculum
          </NavLink>
          <NavLink to="/flashcards" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon">🃏</span> Flashcards
          </NavLink>
          <NavLink to="/progress" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon">📈</span> My Progress
          </NavLink>

          {user && (
            <>
              <div className="nav-section-label" style={{ marginTop: '0.5rem' }}>Account</div>
              <NavLink to="/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                <span className="nav-icon">👤</span> Profile
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          {user ? (
            <button className="nav-button" onClick={handleLogout}>
              <span className="nav-icon">🚪</span> Sign out
            </button>
          ) : (
            <Link to="/login" className="nav-link" style={{ display: 'flex', gap: '0.75rem', padding: '0.65rem 0.75rem' }}>
              <span className="nav-icon">🔑</span> Sign in
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
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

export default function NavBar() {
  const { user, logout } = useAuth();

  return (
    <header className="site-header">
      <div className="container flex items-center justify-between gap-4 py-4">
        <Link to="/" className="logo">ArticulateAI</Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm font-medium text-slate-600">
          <Link to="/curriculum" className="nav-link">Curriculum</Link>
          <Link to="/progress" className="nav-link">Progress</Link>
          {user ? (
            <>
              <Link to="/flashcards" className="nav-link">Flashcards</Link>
              <Link to="/profile" className="nav-link">Profile</Link>
              <button type="button" onClick={logout} className="nav-button">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

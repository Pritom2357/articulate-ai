import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';
import { IS_RENDER_BACKEND } from '../utils/apiClient.js';
import ColdStartNotice from '../components/ColdStartNotice.jsx';
import { Sun, Moon } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const { theme, toggleTheme, language } = useThemeLanguage();
  const navigate = useNavigate();

  // Redirect to curriculum if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate('/curriculum', { replace: true });
    }
  }, [user, navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate('/curriculum');
    } catch (err) {
      const baseMessage = err.payload?.error || err.message || 'Login failed. Please check your credentials.';
      const retryHint = IS_RENDER_BACKEND
        ? (language === 'bn'
          ? ' যদি এটি আপনার প্রথম চেষ্টা হয়, সার্ভার জেগে উঠতে কিছুক্ষণ সময় লাগতে পারে — কিছুক্ষণ পর আবার চেষ্টা করুন।'
          : ' If this is your first attempt in a while, the server may still be waking up — please try again in a moment.')
        : '';
      setError(baseMessage + retryHint);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="colorful-mesh-container">
      {/* Decorative third mesh blob */}
      <div className="mesh-blob-3"></div>

      {/* Floating Theme Switcher */}
      <div className="absolute top-4 right-4 z-50">
        <button 
          onClick={toggleTheme} 
          className="top-bar-icon-btn" 
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          style={{ width: '40px', height: '40px' }}
        >
          {theme === 'dark' ? <Sun size={20} className="text-yellow-400" /> : <Moon size={20} className="text-indigo-600" />}
        </button>
      </div>

      <div className="glass-form-card">
        {/* Animated brand logo watermark */}
        <Link to="/" className="form-watermark hover:opacity-80 transition-opacity" style={{ textDecoration: 'none' }}>
          <span className="form-watermark-icon">🎙️</span>
          <span className="form-watermark-text">ARTICULATE AI</span>
        </Link>

        <h1 className="glass-title">Welcome Back</h1>
        <p className="glass-subtitle">Log in to your account and continue your learning journey.</p>

        <ColdStartNotice language={language} />

        <form onSubmit={handleSubmit} className="glass-grid">
          <label className="glass-label">
            Email Address
            <input
              className="glass-input"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={isLoading}
            />
          </label>

          <label className="glass-label">
            Password
            <input
              className="glass-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={isLoading}
            />
          </label>

          <button className="glass-button" type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ marginRight: '0.5rem', display: 'inline-block', width: '1.25rem', height: '1.25rem' }}>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </>
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <p className="glass-note">
          New to Articulate AI?{' '}
          <Link className="glass-link" to="/register">
            Create an account
          </Link>
        </p>

        {error && (
          <div className="glass-alert glass-alert-error">
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

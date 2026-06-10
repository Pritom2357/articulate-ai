import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      await login({ email, password });
      navigate('/profile');
    } catch (err) {
      setError(err.payload?.error || err.message || 'Login failed');
    }
  }

  return (
    <div className="page-container">
      <div className="form-card">
        <h1 className="page-title">Login</h1>
        <p className="page-subtitle">Access your account to continue learning.</p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-label">
            Email
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="form-label">
            Password
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button className="form-button" type="submit">Login</button>
        </form>
        <p className="form-note">
          New here? <Link className="link" to="/register">Create an account</Link>
        </p>
        {error && <div className="alert alert-error">{error}</div>}
      </div>
    </div>
  );
}

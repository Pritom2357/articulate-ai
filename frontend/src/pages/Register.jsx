import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth.js';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      await register({ name, email, password, phone, gender, date_of_birth: dateOfBirth });
      setMessage('Registration successful. You can now log in.');
      navigate('/login');
    } catch (err) {
      setError(err.payload?.error || err.message || 'Registration failed');
    }
  }

  return (
    <div className="page-container">
      <div className="form-card">
        <h1 className="page-title">Create account</h1>
        <p className="page-subtitle">Join and start learning with your personalized curriculum.</p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="form-label">
            Full name
            <input
              className="form-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
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
            Phone
            <input
              className="form-input"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              required
            />
          </label>
          <label className="form-label">
            Gender
            <select
              className="form-input"
              value={gender}
              onChange={(event) => setGender(event.target.value)}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="form-label">
            Date of birth
            <input
              className="form-input"
              type="date"
              value={dateOfBirth}
              onChange={(event) => setDateOfBirth(event.target.value)}
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
          <button className="form-button" type="submit">Register</button>
        </form>
        <p className="form-note">
          Already have an account? <Link className="link" to="/login">Login</Link>
        </p>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}
      </div>
    </div>
  );
}

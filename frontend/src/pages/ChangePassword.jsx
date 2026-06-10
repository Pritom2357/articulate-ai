import { useState } from 'react';
import { changePassword } from '../api/user.js';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setError('');
      await changePassword({ oldPassword, newPassword });
      setMessage('Password changed successfully');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage('');
      setError(err.payload?.error || err.message || 'Change failed');
    }
  }

  return (
    <div className="page-container">
      <div className="form-card max-w-lg mx-auto">
        <h1 className="page-title">Change password</h1>
        <p className="page-subtitle">Update your password for better security.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="form-label">
            Current password
            <input
              className="form-input"
              type="password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              required
            />
          </label>
          <label className="form-label">
            New password
            <input
              className="form-input"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </label>
          <label className="form-label">
            Confirm new password
            <input
              className="form-input"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
          <button className="form-button" type="submit">Save password</button>
        </form>
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}
      </div>
    </div>
  );
}

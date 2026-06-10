import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { updateProfile, uploadAvatar } from '../api/user.js';
import AvatarUploader from '../components/AvatarUploader.jsx';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setGender(user.gender || '');
      setDob(user.date_of_birth || '');
    }
  }, [user]);

  async function handleSave(event) {
    event.preventDefault();
    try {
      setError('');
      await updateProfile(user.id, { name, phone, gender, date_of_birth: dob });
      setMessage('Profile saved successfully.');
      refreshUser();
    } catch (err) {
      setMessage('');
      setError(err.payload?.error || err.message || 'Update failed');
    }
  }

  async function handleAvatar(file) {
    try {
      await uploadAvatar(user.id, file);
      setMessage('Avatar uploaded.');
      refreshUser();
    } catch (err) {
      setError(err.payload?.error || err.message || 'Avatar upload failed');
    }
  }

  if (!user) {
    return <div className="page-container">Loading profile…</div>;
  }

  return (
    <div className="page-container">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="profile-card">
          <div className="profile-avatar">
            {user.profile_photo ? (
              <img src={user.profile_photo} alt="Profile" className="rounded-full" />
            ) : (
              <div className="avatar-placeholder">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
            )}
          </div>
          <h2 className="text-2xl font-semibold">{user.name}</h2>
          <p className="text-sm text-slate-500">{user.email}</p>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <p><strong>Role:</strong> {user.role || 'Student'}</p>
            <p><strong>Status:</strong> {user.is_active ? 'Active' : 'Inactive'}</p>
          </div>
          <Link to="/profile/change-password" className="secondary-button mt-6 block text-center">
            Change password
          </Link>
          <AvatarUploader userId={user.id} onUpload={handleAvatar} />
        </div>

        <div className="form-card">
          <h1 className="page-title">Edit profile</h1>
          <form className="space-y-4" onSubmit={handleSave}>
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
              <select className="form-input" value={gender} onChange={(event) => setGender(event.target.value)}>
                <option value="">Select</option>
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
                value={dob}
                onChange={(event) => setDob(event.target.value)}
              />
            </label>
            <button className="form-button" type="submit">Save changes</button>
          </form>
          {message && <div className="alert alert-success">{message}</div>}
          {error && <div className="alert alert-error">{error}</div>}
        </div>
      </div>
    </div>
  );
}

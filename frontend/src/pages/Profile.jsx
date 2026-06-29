import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.js';
import { updateProfile, uploadAvatar, deactivateAccount, deleteAccount } from '../api/user.js';
import { AlertTriangle, Trash2, PowerOff, Camera, Loader2 } from 'lucide-react';
import maleAvatar from '../assets/articulate_male.jpeg';
import femaleAvatar from '../assets/articulate_female.jpeg';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const { language } = useThemeLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [guidePref, setGuidePref] = useState('MALE');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setGender(user.gender || '');
      // Ensure date is formatted as YYYY-MM-DD for the HTML date input
      const formattedDob = user.date_of_birth ? user.date_of_birth.split('T')[0] : '';
      setDob(formattedDob);
      setGuidePref(user.guide_preference || 'MALE');
    }
  }, [user]);

  async function handleSave(event) {
    event.preventDefault();
    try {
      setError('');
      await updateProfile(user.id, {
        name,
        phone,
        gender,
        date_of_birth: dob,
        guide_preference: guidePref
      });
      setMessage('Profile saved successfully.');
      refreshUser();
    } catch (err) {
      setMessage('');
      setError(err.payload?.error || err.message || 'Update failed');
    }
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setAvatarUploading(true);
      await uploadAvatar(user.id, file);
      setMessage('Avatar uploaded successfully.');
      refreshUser();
    } catch (err) {
      setError(err.payload?.error || err.message || 'Avatar upload failed');
    } finally {
      setAvatarUploading(false);
    }
  }

  if (!user) {
    return <div className="page-container">Loading profile…</div>;
  }

  async function handleDeactivate() {
    if (window.confirm(language === 'bn' ? "আপনি কি নিশ্চিত যে আপনি আপনার অ্যাকাউন্ট নিষ্ক্রিয় করতে চান? (Are you sure you want to deactivate your account?)" : "Are you sure you want to deactivate your account?")) {
      try {
        await deactivateAccount(user.id);
        logout();
        navigate('/login');
      } catch (err) {
        setError(err.payload?.error || err.message || 'Deactivation failed');
      }
    }
  }

  async function handleDelete() {
    if (window.confirm(language === 'bn' ? "সতর্কতা: এটি স্থায়ীভাবে আপনার অ্যাকাউন্ট মুছে ফেলবে! আপনি কি নিশ্চিত? (WARNING: This will permanently delete your account! Are you sure?)" : "WARNING: This will permanently delete your account! Are you sure?")) {
      try {
        await deleteAccount(user.id);
        logout();
        navigate('/login');
      } catch (err) {
        setError(err.payload?.error || err.message || 'Deletion failed');
      }
    }
  }

  return (
    <div className="page-container">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="profile-card">
          <div className="relative w-[120px] h-[120px] mx-auto">
            <div className="profile-avatar relative w-full h-full overflow-hidden shadow-xl border-4" style={{ borderColor: 'var(--card-bg)' }}>
              {avatarUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                  <Loader2 className="animate-spin text-white" size={32} />
                </div>
              )}
              {user.profile_photo ? (
                <img src={user.profile_photo} alt="Profile" className="rounded-full w-full h-full object-cover" />
              ) : (
                <div className="avatar-placeholder w-full h-full flex items-center justify-center">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <label 
              className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-full cursor-pointer shadow-lg border-4 transition-transform hover:scale-110 z-20 flex items-center justify-center"
              style={{ borderColor: 'var(--card-bg)' }}
              title="Change Profile Photo"
            >
              <Camera size={16} />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} disabled={avatarUploading} />
            </label>
          </div>
          
          <h2 className="text-2xl font-bold mt-2 text-center" style={{ color: 'var(--text-title)' }}>{user.name}</h2>
          <p className="text-sm text-center mb-2" style={{ color: 'var(--text-subtitle)' }}>{user.email}</p>
          
          <div className="w-full space-y-4 pt-6 mt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold" style={{ color: 'var(--text-subtitle)' }}>Role</span>
              <span className="font-bold px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 border border-indigo-500/20">{user.role || 'Student'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold" style={{ color: 'var(--text-subtitle)' }}>Status</span>
              <span className="font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">{user.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            {user.phone && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold" style={{ color: 'var(--text-subtitle)' }}>Phone</span>
                <span className="font-medium" style={{ color: 'var(--text-title)' }}>{user.phone}</span>
              </div>
            )}
            {user.gender && (
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold" style={{ color: 'var(--text-subtitle)' }}>Gender</span>
                <span className="font-medium capitalize" style={{ color: 'var(--text-title)' }}>{user.gender.toLowerCase()}</span>
              </div>
            )}
          </div>
          
          <Link to="/profile/change-password" className="secondary-button mt-6 w-full text-center flex justify-center">
            Change password
          </Link>
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
              Active Tutor Guide
              <div className="flex gap-4 mt-2 mb-4">
                <div
                  onClick={() => setGuidePref('MALE')}
                  className={`flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    guidePref === 'MALE'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                    <img src={maleAvatar} alt="Rohit" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-xs" style={{ color: 'var(--text-title)' }}>{language === 'bn' ? 'Rohit (রোহিত)' : 'Rohit'}</div>
                    <div className="text-slate-400" style={{ fontSize: '10px' }}>Male Tutor Guide</div>
                  </div>
                </div>
                <div
                  onClick={() => setGuidePref('FEMALE')}
                  className={`flex-1 flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    guidePref === 'FEMALE'
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-white/10 hover:bg-white/5'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                    <img src={femaleAvatar} alt="Riya" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold text-xs" style={{ color: 'var(--text-title)' }}>{language === 'bn' ? 'Riya (রিয়া)' : 'Riya'}</div>
                    <div className="text-slate-400" style={{ fontSize: '10px' }}>Female Tutor Guide</div>
                  </div>
                </div>
              </div>
            </label>

            <label className="form-label">
              Gender
              <select className="form-input" value={gender} onChange={(event) => setGender(event.target.value)}>
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="NON-BINARY">Other</option>
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

      {/* Danger Zone */}
      <div className="mt-8 pt-8 border-t border-rose-500/20 max-w-4xl">
        <h2 className="text-xl font-bold text-rose-500 flex items-center gap-2 mb-4">
          <AlertTriangle size={20} />
          {language === 'bn' ? 'বিপজ্জনক এলাকা (Danger Zone)' : 'Danger Zone'}
        </h2>
        <div className="card-card bg-rose-950/10 border border-rose-500/20 p-6 rounded-2xl grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-title)' }}>{language === 'bn' ? 'অ্যাকাউন্ট নিষ্ক্রিয় করুন (Deactivate)' : 'Deactivate Account'}</h3>
            <p className="text-xs text-slate-400">{language === 'bn' ? 'আপনার অ্যাকাউন্ট সাময়িকভাবে লুকিয়ে রাখুন। আপনি পরে আবার লগ ইন করে এটি চালু করতে পারবেন।' : 'Temporarily hide your account. You can log back in later to reactivate it.'}</p>
          </div>
          <div className="flex md:justify-end">
            <button onClick={handleDeactivate} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
              <PowerOff size={16} /> {language === 'bn' ? 'নিষ্ক্রিয় করুন' : 'Deactivate'}
            </button>
          </div>
          
          <div className="md:col-span-2 h-px bg-rose-500/10"></div>
 
          <div>
            <h3 className="font-bold text-rose-400 text-sm mb-1">{language === 'bn' ? 'অ্যাকাউন্ট মুছুন (Delete)' : 'Delete Account'}</h3>
            <p className="text-xs text-slate-400">{language === 'bn' ? 'আপনার সমস্ত ডেটা, অগ্রগতি এবং সেটিংস স্থায়ীভাবে মুছে যাবে। এই কাজ বাতিল করা যাবে না!' : 'All your data, progress, and settings will be permanently deleted. This action cannot be undone!'}</p>
          </div>
          <div className="flex md:justify-end">
            <button onClick={handleDelete} className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
              <Trash2 size={16} /> {language === 'bn' ? 'মুছে ফেলুন' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

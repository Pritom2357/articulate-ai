import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth.js';
import useAuth from '../hooks/useAuth.js';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';
import { Sun, Moon } from 'lucide-react';

export default function Register() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useThemeLanguage();
  const navigate = useNavigate();

  // Redirect to curriculum if user is already authenticated
  useEffect(() => {
    if (user) {
      navigate('/curriculum', { replace: true });
    }
  }, [user, navigate]);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  
  // Validation touched states
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    phone: false,
    password: false,
    gender: false,
    dateOfBirth: false
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Real-time validation rules
  const isNameValid = name.trim().length >= 3;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isPhoneValid = /^01[3-9]\d{8}$/.test(phone); // Bangladesh 11-digit mobile format
  const isPasswordValid = password.length >= 6;
  const isGenderValid = gender !== '';
  const isDobValid = dateOfBirth !== '';

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Password strength checker
  const getPasswordStrength = () => {
    if (!password) return { label: '', color: 'transparent', width: '0%' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 1) return { label: 'Weak (দুর্বল)', color: '#ef4444', width: '25%' };
    if (score <= 3) return { label: 'Medium (মাঝারি)', color: '#f59e0b', width: '60%' };
    return { label: 'Strong (শক্তিশালী)', color: '#22c55e', width: '100%' };
  };

  const strength = getPasswordStrength();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    
    // Mark all as touched
    setTouched({
      name: true,
      email: true,
      phone: true,
      password: true,
      gender: true,
      dateOfBirth: true
    });

    if (!isNameValid || !isEmailValid || !isPhoneValid || !isPasswordValid || !isGenderValid) {
      setError('অনুগ্রহ করে সবগুলো ঘর সঠিকভাবে পূরণ করুন।');
      return;
    }

    setIsLoading(true);

    try {
      await register({ name, email, password, phone, gender, date_of_birth: dateOfBirth });
      setMessage('নিবন্ধন সফল হয়েছে! লগইন পেজে রিডাইরেক্ট করা হচ্ছে...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.payload?.error || err.message || 'নিবন্ধন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
      setIsLoading(false);
    }
  }

  // Helper classes for input validation cues
  const getInputClass = (field, isValid) => {
    if (!touched[field]) return 'glass-input';
    return isValid ? 'glass-input val-valid' : 'glass-input val-invalid';
  };

  return (
    <div className="colorful-mesh-container">
      <div className="mesh-blob-3"></div>

      <div className="glass-form-card wide-card animate-fade-in">
        {/* Animated brand logo watermark */}
        <Link to="/" className="form-watermark hover:opacity-80 transition-opacity" style={{ textDecoration: 'none' }}>
          <span className="form-watermark-icon">🎙️</span>
          <span className="form-watermark-text">ARTICULATE AI</span>
        </Link>

        <h1 className="glass-title">Create Account</h1>
        <p className="glass-subtitle">নিবন্ধন করুন এবং আপনার নিজস্ব লার্নিং জার্নি শুরু করুন।</p>

        <form onSubmit={handleSubmit} className="glass-grid two-cols">
          
          {/* Full Name */}
          <label className="glass-label relative">
            <span>Full Name <span className="text-red-400">*</span></span>
            <input
              className={getInputClass('name', isNameValid)}
              placeholder="যেমন: Pritom Biswas"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              required
              disabled={isLoading}
            />
            {touched.name && !isNameValid && (
              <span className="val-error-text">নাম কমপক্ষে ৩ অক্ষরের হতে হবে।</span>
            )}
            {touched.name && isNameValid && <span className="val-check-icon">✓</span>}
          </label>

          {/* Email */}
          <label className="glass-label relative">
            <span>Email Address <span className="text-red-400">*</span></span>
            <input
              className={getInputClass('email', isEmailValid)}
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur('email')}
              required
              disabled={isLoading}
            />
            {touched.email && !isEmailValid && (
              <span className="val-error-text">সঠিক ইমেইল ঠিকানা প্রদান করুন।</span>
            )}
            {touched.email && isEmailValid && <span className="val-check-icon">✓</span>}
          </label>

          {/* Phone */}
          <label className="glass-label relative">
            <span>Phone Number <span className="text-red-400">*</span></span>
            <input
              className={getInputClass('phone', isPhoneValid)}
              type="tel"
              placeholder="যেমন: 01712345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => handleBlur('phone')}
              required
              disabled={isLoading}
            />
            {touched.phone && !isPhoneValid && (
              <span className="val-error-text">১১ ডিজিটের সচল মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)</span>
            )}
            {touched.phone && isPhoneValid && <span className="val-check-icon">✓</span>}
          </label>

          {/* Gender */}
          <label className="glass-label relative">
            <span>Gender <span className="text-red-400">*</span></span>
            <select
              className={touched.gender && !isGenderValid ? 'glass-select val-invalid' : 'glass-select'}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              onBlur={() => handleBlur('gender')}
              disabled={isLoading}
            >
              <option value="">Select gender</option>
              <option value="MALE">Male (পুরুষ)</option>
              <option value="FEMALE">Female (নারী)</option>
              <option value="NON-BINARY">Other (অন্যান্য)</option>
            </select>
            {touched.gender && !isGenderValid && (
              <span className="val-error-text">লিঙ্গ নির্বাচন করা আবশ্যক।</span>
            )}
          </label>

          {/* Date of Birth */}
          <label className="glass-label relative">
            <span>Date of Birth <span className="text-red-400">*</span></span>
            <input
              className={getInputClass('dateOfBirth', isDobValid)}
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              onBlur={() => handleBlur('dateOfBirth')}
              required
              disabled={isLoading}
            />
            {touched.dateOfBirth && !isDobValid && (
              <span className="val-error-text">জন্মতারিখ দেওয়া আবশ্যক।</span>
            )}
          </label>

          {/* Password */}
          <label className="glass-label relative">
            <span>Password <span className="text-red-400">*</span></span>
            <input
              className={getInputClass('password', isPasswordValid)}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur('password')}
              required
              disabled={isLoading}
            />
            {touched.password && !isPasswordValid && (
              <span className="val-error-text">পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।</span>
            )}
            {touched.password && isPasswordValid && <span className="val-check-icon">✓</span>}

            {/* Password Strength Meter */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Strength: {strength.label}</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: strength.width, backgroundColor: strength.color }}
                  ></div>
                </div>
              </div>
            )}
          </label>

          <div className="grid-span-2 mt-4">
            <button className="glass-button" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ marginRight: '0.5rem', display: 'inline-block', width: '1.25rem', height: '1.25rem' }}>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Account তৈরি হচ্ছে...
                </>
              ) : (
                'Create Account (নিবন্ধন করুন)'
              )}
            </button>
          </div>
        </form>

        <p className="glass-note">
          Already have an account?{' '}
          <Link className="glass-link" to="/login">
            Login here (লগইন করুন)
          </Link>
        </p>

        {message && (
          <div className="glass-alert glass-alert-success animate-bounce-in">
            <span style={{ fontSize: '1.2rem' }}>✅</span>
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="glass-alert glass-alert-error animate-shake">
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

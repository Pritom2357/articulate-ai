import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../api/auth.js';
import useAuth from '../hooks/useAuth.js';
import { useThemeLanguage } from '../contexts/ThemeLanguageContext.jsx';
import { Sun, Moon } from 'lucide-react';

export default function Register() {
  const { user } = useAuth();
  const { theme, toggleTheme, language } = useThemeLanguage();
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

    if (score <= 1) return { label: language === 'bn' ? 'Weak (দুর্বল)' : 'Weak', color: '#ef4444', width: '25%' };
    if (score <= 3) return { label: language === 'bn' ? 'Medium (মাঝারি)' : 'Medium', color: '#f59e0b', width: '60%' };
    return { label: language === 'bn' ? 'Strong (শক্তিশালী)' : 'Strong', color: '#22c55e', width: '100%' };
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
      setError(language === 'bn' ? 'অনুগ্রহ করে সবগুলো ঘর সঠিকভাবে পূরণ করুন।' : 'Please fill all fields correctly.');
      return;
    }

    setIsLoading(true);

    try {
      await register({ name, email, password, phone, gender, date_of_birth: dateOfBirth });
      setMessage(language === 'bn' ? 'নিবন্ধন সফল হয়েছে! লগইন পেজে রিডাইরেক্ট করা হচ্ছে...' : 'Registration successful! Redirecting to login page...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.payload?.error || err.message || (language === 'bn' ? 'নিবন্ধন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' : 'Registration failed. Please try again.'));
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

        <h1 className="glass-title">{language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}</h1>
        <p className="glass-subtitle">{language === 'bn' ? 'নিবন্ধন করুন এবং আপনার নিজস্ব লার্নিং জার্নি শুরু করুন।' : 'Register and start your own learning journey.'}</p>

        <form onSubmit={handleSubmit} className="glass-grid two-cols">
          
          <label className="glass-label relative">
            <span>{language === 'bn' ? 'সম্পূর্ণ নাম' : 'Full Name'} <span className="text-red-400">*</span></span>
            <input
              className={getInputClass('name', isNameValid)}
              placeholder={language === 'bn' ? 'যেমন: Pritom Biswas' : 'e.g. Pritom Biswas'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur('name')}
              required
              disabled={isLoading}
            />
            {touched.name && !isNameValid && (
              <span className="val-error-text">{language === 'bn' ? 'নাম কমপক্ষে ৩ অক্ষরের হতে হবে।' : 'Name must be at least 3 characters long.'}</span>
            )}
            {touched.name && isNameValid && <span className="val-check-icon">✓</span>}
          </label>

          <label className="glass-label relative">
            <span>{language === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address'} <span className="text-red-400">*</span></span>
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
              <span className="val-error-text">{language === 'bn' ? 'সঠিক ইমেইল ঠিকানা প্রদান করুন।' : 'Please provide a valid email address.'}</span>
            )}
            {touched.email && isEmailValid && <span className="val-check-icon">✓</span>}
          </label>

          <label className="glass-label relative">
            <span>{language === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number'} <span className="text-red-400">*</span></span>
            <input
              className={getInputClass('phone', isPhoneValid)}
              type="tel"
              placeholder={language === 'bn' ? 'যেমন: 01712345678' : 'e.g. 01712345678'}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => handleBlur('phone')}
              required
              disabled={isLoading}
            />
            {touched.phone && !isPhoneValid && (
              <span className="val-error-text">{language === 'bn' ? '১১ ডিজিটের সচল মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)' : 'Enter an 11-digit active mobile number (e.g., 017XXXXXXXX)'}</span>
            )}
            {touched.phone && isPhoneValid && <span className="val-check-icon">✓</span>}
          </label>

          <label className="glass-label relative">
            <span>{language === 'bn' ? 'লিঙ্গ' : 'Gender'} <span className="text-red-400">*</span></span>
            <select
              className={touched.gender && !isGenderValid ? 'glass-select val-invalid' : 'glass-select'}
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              onBlur={() => handleBlur('gender')}
              disabled={isLoading}
            >
              <option value="">{language === 'bn' ? 'লিঙ্গ নির্বাচন করুন' : 'Select gender'}</option>
              <option value="MALE">{language === 'bn' ? 'Male (পুরুষ)' : 'Male'}</option>
              <option value="FEMALE">{language === 'bn' ? 'Female (নারী)' : 'Female'}</option>
              <option value="NON-BINARY">{language === 'bn' ? 'Other (অন্যান্য)' : 'Other'}</option>
            </select>
            {touched.gender && !isGenderValid && (
              <span className="val-error-text">{language === 'bn' ? 'লিঙ্গ নির্বাচন করা আবশ্যক।' : 'Gender selection is required.'}</span>
            )}
          </label>

          <label className="glass-label relative">
            <span>{language === 'bn' ? 'জন্মতারিখ' : 'Date of Birth'} <span className="text-red-400">*</span></span>
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
              <span className="val-error-text">{language === 'bn' ? 'জন্মতারিখ দেওয়া আবশ্যক।' : 'Date of birth is required.'}</span>
            )}
          </label>

          <label className="glass-label relative">
            <span>{language === 'bn' ? 'পাসওয়ার্ড' : 'Password'} <span className="text-red-400">*</span></span>
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
              <span className="val-error-text">{language === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters long.'}</span>
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
                  {language === 'bn' ? 'Account তৈরি হচ্ছে...' : 'Creating Account...'}
                </>
              ) : (
                language === 'bn' ? 'Create Account (নিবন্ধন করুন)' : 'Create Account'
              )}
            </button>
          </div>
        </form>

        <p className="glass-note">
          {language === 'bn' ? 'ইতিমধ্যে অ্যাকাউন্ট আছে?' : 'Already have an account?'} {' '}
          <Link className="glass-link" to="/login">
            {language === 'bn' ? 'Login here (লগইন করুন)' : 'Login here'}
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

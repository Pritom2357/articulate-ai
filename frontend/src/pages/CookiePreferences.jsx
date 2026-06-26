import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie, ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react';

export default function CookiePreferences() {
  const [preferences, setPreferences] = useState({
    necessary: true,       // always on
    functional: true,
    analytics: false,
    marketing: false,
  });

  const toggle = (key) => {
    if (key === 'necessary') return; // cannot disable
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const savePreferences = () => {
    try {
      localStorage.setItem('cookie_preferences', JSON.stringify(preferences));
    } catch (_) {}
    alert('Your cookie preferences have been saved.');
  };

  const cookieGroups = [
    {
      key: 'necessary',
      label: 'Strictly Necessary',
      color: '#6366f1',
      colorBg: 'rgba(99,102,241,0.1)',
      colorBorder: 'rgba(99,102,241,0.2)',
      icon: '🔒',
      required: true,
      description: 'These cookies are essential for the website to function and cannot be switched off. They include session authentication, security tokens, and your language/theme preferences.',
      examples: ['Session token', 'CSRF protection', 'Theme preference', 'Language setting'],
    },
    {
      key: 'functional',
      label: 'Functional',
      color: '#06b6d4',
      colorBg: 'rgba(6,182,212,0.08)',
      colorBorder: 'rgba(6,182,212,0.2)',
      icon: '⚙️',
      required: false,
      description: 'These cookies enable enhanced functionality such as remembering your AI tutor preference, last visited lesson, and personalized learning settings.',
      examples: ['Tutor preference', 'Last lesson position', 'Flashcard settings'],
    },
    {
      key: 'analytics',
      label: 'Analytics',
      color: '#f59e0b',
      colorBg: 'rgba(245,158,11,0.08)',
      colorBorder: 'rgba(245,158,11,0.2)',
      icon: '📊',
      required: false,
      description: 'These cookies help us understand how users interact with the platform so we can improve it. All data is aggregated and anonymized.',
      examples: ['Page view counts', 'Feature usage stats', 'Error reporting'],
    },
    {
      key: 'marketing',
      label: 'Marketing',
      color: '#ec4899',
      colorBg: 'rgba(236,72,153,0.08)',
      colorBorder: 'rgba(236,72,153,0.2)',
      icon: '📢',
      required: false,
      description: 'These cookies may be used to show you relevant advertisements and track marketing campaign performance. We do not use these for third-party ad networks.',
      examples: ['Campaign tracking', 'Referral source'],
    },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#070a12', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
        <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Legal</span>
      </div>

      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        {/* Hero */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cookie size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '2px' }}>Legal Document</div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#fff', margin: 0 }}>Cookie Preferences</h1>
          </div>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '3rem', lineHeight: 1.7 }}>
          Manage how Articulate AI uses cookies on your device. Toggle each category below to customize your experience. Strictly necessary cookies cannot be disabled as they are required for the platform to function.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
          {cookieGroups.map((group) => {
            const isOn = preferences[group.key];
            return (
              <div
                key={group.key}
                style={{
                  borderRadius: '16px',
                  background: group.colorBg,
                  border: `1px solid ${group.colorBorder}`,
                  padding: '1.5rem',
                  transition: 'opacity 0.2s',
                  opacity: group.required ? 0.9 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>{group.icon}</span>
                    <div>
                      <div style={{ fontWeight: 800, color: '#f1f5f9', fontSize: '0.9rem' }}>{group.label}</div>
                      {group.required && (
                        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: group.color, background: `${group.colorBg}`, border: `1px solid ${group.colorBorder}`, padding: '1px 6px', borderRadius: '999px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          Always Active
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggle(group.key)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: group.required ? 'not-allowed' : 'pointer',
                      padding: 0,
                      opacity: group.required ? 0.5 : 1,
                      transition: 'transform 0.15s',
                      flexShrink: 0,
                    }}
                    title={group.required ? 'Cannot be disabled' : (isOn ? 'Disable' : 'Enable')}
                  >
                    {isOn
                      ? <ToggleRight size={36} color={group.color} />
                      : <ToggleLeft size={36} color="#475569" />
                    }
                  </button>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: 1.7, margin: '0 0 0.75rem 0' }}>{group.description}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {group.examples.map((ex) => (
                    <span key={ex} style={{ fontSize: '0.68rem', color: group.color, background: group.colorBg, border: `1px solid ${group.colorBorder}`, padding: '2px 8px', borderRadius: '999px' }}>
                      {ex}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={savePreferences}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.875rem',
              border: 'none',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.9'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            Save Preferences
          </button>
          <button
            onClick={() => setPreferences({ necessary: true, functional: true, analytics: true, marketing: true })}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)',
              color: '#94a3b8',
              fontWeight: 600,
              fontSize: '0.875rem',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            Accept All
          </button>
          <button
            onClick={() => setPreferences({ necessary: true, functional: false, analytics: false, marketing: false })}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.05)',
              color: '#94a3b8',
              fontWeight: 600,
              fontSize: '0.875rem',
              border: '1px solid rgba(255,255,255,0.1)',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            Reject Optional
          </button>
        </div>

        <div style={{ marginTop: '3rem', padding: '1.25rem', borderRadius: '14px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
          <p style={{ color: '#64748b', fontSize: '0.78rem', margin: 0, lineHeight: 1.7 }}>
            For more information on how we use cookies, please read our{' '}
            <Link to="/privacy-policy" style={{ color: '#fbbf24', textDecoration: 'none' }}>Privacy Policy</Link>.
            Cookie preferences are stored locally on your device and applied on your next visit.
          </p>
        </div>
      </div>
    </div>
  );
}

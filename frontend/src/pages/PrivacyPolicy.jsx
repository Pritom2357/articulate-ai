import { Link } from 'react-router-dom';
import { Lock, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
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
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #06b6d4, #0e7490)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#06b6d4', textTransform: 'uppercase', marginBottom: '2px' }}>Legal Document</div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#fff', margin: 0 }}>Privacy Policy</h1>
          </div>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '3rem' }}>Last updated: June 26, 2025 &nbsp;·&nbsp; Effective: June 26, 2025</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

          {/* Sections rendered individually so section 6 can have an inline link */}
          {[
            { title: '1. Information We Collect', body: `We collect information you provide directly to us, such as your name, email address, password, and profile photo when you create an account. We also collect your learning activity data including completed lessons, vocabulary progress, IELTS test scores, and AI conversation sessions to personalize your experience.` },
            { title: '2. How We Use Your Information', body: `We use the information we collect to: operate and improve the Service; personalize your learning experience; track your progress and generate insights; send you notifications about your activity; communicate with you about updates and features; and detect and prevent fraudulent or abusive activities.` },
            { title: '3. Voice and Audio Data', body: `When you use our AI voice features, your speech is processed in real-time to generate responses. Audio recordings are processed by our AI providers and are not permanently stored on our servers beyond what is necessary to complete the session. We do not use your voice recordings for any purpose other than providing the requested service.` },
            { title: '4. Information Sharing', body: `We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted third-party service providers who assist us in operating the platform (such as cloud infrastructure and AI providers), subject to strict confidentiality agreements. We may also disclose information if required by law.` },
            { title: '5. Data Retention', body: `We retain your account information for as long as your account is active or as needed to provide the Service. Learning progress data is retained to maintain your learning history. You may request deletion of your account and associated data at any time by contacting support or through your profile settings.` },
          ].map((section) => (
            <section key={section.title} style={{ borderLeft: '2px solid rgba(6,182,212,0.3)', paddingLeft: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#a5f3fc', marginBottom: '0.6rem' }}>{section.title}</h2>
              <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '0.875rem', margin: 0 }}>{section.body}</p>
            </section>
          ))}

          {/* Section 6 — contains an inline link to /cookie-preferences */}
          <section style={{ borderLeft: '2px solid rgba(6,182,212,0.3)', paddingLeft: '1.25rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#a5f3fc', marginBottom: '0.6rem' }}>6. Cookies and Tracking</h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '0.875rem', margin: 0 }}>
              We use cookies and similar tracking technologies to maintain your session, remember your preferences (such as language and theme), and analyze usage patterns to improve the Service. You can control cookie settings through your browser settings or our{' '}
              <Link to="/cookie-preferences" style={{ color: '#22d3ee', textDecoration: 'none' }}>Cookie Preferences</Link> page.
            </p>
          </section>

          {[
            { title: '7. Security', body: `We implement industry-standard security measures to protect your personal information, including encrypted data transmission (HTTPS), secure password hashing, and access controls. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.` },
            { title: `8. Children's Privacy`, body: `The Service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us and we will take steps to delete such information.` },
            { title: '9. Your Rights', body: `You have the right to access, correct, or delete your personal data. You may also object to or restrict certain processing of your data. To exercise these rights, contact us at support@articulate-ai.app. We will respond to your request within 30 days.` },
            { title: '10. Contact Us', body: `If you have questions about this Privacy Policy or our data practices, contact our privacy team at support@articulate-ai.app.` },
          ].map((section) => (
            <section key={section.title} style={{ borderLeft: '2px solid rgba(6,182,212,0.3)', paddingLeft: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#a5f3fc', marginBottom: '0.6rem' }}>{section.title}</h2>
              <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '0.875rem', margin: 0 }}>{section.body}</p>
            </section>
          ))}

        </div>

        <div style={{ marginTop: '4rem', padding: '1.5rem', borderRadius: '16px', background: 'rgba(6,182,212,0.07)', border: '1px solid rgba(6,182,212,0.2)', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
            Privacy questions? Email us at <a href="mailto:support@articulate-ai.app" style={{ color: '#22d3ee', textDecoration: 'none' }}>support@articulate-ai.app</a>
          </p>
        </div>
      </div>
    </div>
  );
}

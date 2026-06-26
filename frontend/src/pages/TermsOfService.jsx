import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
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
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#6366f1', textTransform: 'uppercase', marginBottom: '2px' }}>Legal Document</div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#fff', margin: 0 }}>Terms of Service</h1>
          </div>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '3rem' }}>Last updated: June 26, 2025 &nbsp;·&nbsp; Effective: June 26, 2025</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {[
            {
              title: '1. Acceptance of Terms',
              body: `By accessing or using Articulate AI ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. These terms apply to all visitors, users, and others who access the Service.`
            },
            {
              title: '2. Description of Service',
              body: `Articulate AI is an AI-powered English language learning platform that provides interactive voice conversations, IELTS Speaking practice, vocabulary flashcards, placement assessments, and progress tracking. The Service is intended for educational and personal development purposes only.`
            },
            {
              title: '3. User Accounts',
              body: `You must create an account to access most features. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.`
            },
            {
              title: '4. Acceptable Use',
              body: `You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to gain unauthorized access to any systems; (c) transmit harmful, offensive, or disruptive content; (d) scrape, crawl, or extract data from the Service without permission; (e) impersonate any person or entity; or (f) interfere with the proper working of the Service.`
            },
            {
              title: '5. AI-Generated Content',
              body: `Our platform uses artificial intelligence to generate educational content, feedback, and conversation responses. While we strive for accuracy, AI-generated content may contain errors. Articulate AI does not guarantee the accuracy, completeness, or usefulness of any AI-generated content, and you should not rely solely on it for critical decisions.`
            },
            {
              title: '6. Intellectual Property',
              body: `The Service and its original content, features, and functionality are and will remain the exclusive property of Articulate AI. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent. Content you create or upload remains yours, but you grant us a license to use it to operate the Service.`
            },
            {
              title: '7. Termination',
              body: `We may terminate or suspend your account immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms. Upon termination, your right to use the Service will cease immediately. You may also delete your account at any time from your profile settings.`
            },
            {
              title: '8. Limitation of Liability',
              body: `In no event shall Articulate AI, its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation loss of data, profits, or goodwill, arising out of or in connection with your use of the Service.`
            },
            {
              title: '9. Changes to Terms',
              body: `We reserve the right to modify these terms at any time. We will provide notice of significant changes by updating the "Last updated" date. Your continued use of the Service after any changes constitutes your acceptance of the new terms.`
            },
            {
              title: '10. Contact',
              body: `If you have any questions about these Terms of Service, please contact us at support@articulate-ai.app.`
            },
          ].map((section) => (
            <section key={section.title} style={{ borderLeft: '2px solid rgba(99,102,241,0.3)', paddingLeft: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#c7d2fe', marginBottom: '0.6rem' }}>{section.title}</h2>
              <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '0.875rem', margin: 0 }}>{section.body}</p>
            </section>
          ))}
        </div>

        <div style={{ marginTop: '4rem', padding: '1.5rem', borderRadius: '16px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
            Questions? Email us at <a href="mailto:support@articulate-ai.app" style={{ color: '#818cf8', textDecoration: 'none' }}>support@articulate-ai.app</a>
          </p>
        </div>
      </div>
    </div>
  );
}

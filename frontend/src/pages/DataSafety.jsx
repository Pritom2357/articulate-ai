import { Link } from 'react-router-dom';
import { Database, ArrowLeft } from 'lucide-react';

export default function DataSafety() {
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
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Database size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: '#10b981', textTransform: 'uppercase', marginBottom: '2px' }}>Legal Document</div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#fff', margin: 0 }}>Data Safety</h1>
          </div>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '3rem' }}>Last updated: June 26, 2025 &nbsp;·&nbsp; Effective: June 26, 2025</p>

        {/* Safety badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
          {[
            { icon: '🔒', label: 'End-to-End Encrypted', desc: 'All data in transit' },
            { icon: '🛡️', label: 'Secure Servers', desc: 'ISO 27001 compliant hosting' },
            { icon: '🗑️', label: 'Right to Delete', desc: 'Erase your data anytime' },
            { icon: '🚫', label: 'No Data Selling', desc: 'We never sell your data' },
          ].map((badge) => (
            <div key={badge.label} style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{badge.icon}</span>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6ee7b7' }}>{badge.label}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{badge.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {[
            {
              title: '1. Data We Collect',
              body: `Articulate AI collects the minimum data necessary to provide the Service. This includes: account credentials (email, hashed password), profile information (name, optional photo), learning activity (completed lessons, test scores, vocabulary progress), and technical data (device type, browser version, IP address for security purposes).`
            },
            {
              title: '2. Data Storage & Infrastructure',
              body: `Your data is stored on secure cloud servers with industry-standard encryption at rest (AES-256). We use reputable cloud providers with physical security, redundancy, and regular security audits. Data is backed up regularly to prevent loss.`
            },
            {
              title: '3. AI Data Processing',
              body: `When you interact with our AI tutors or take IELTS practice tests, your input (text and voice) is processed by third-party AI providers under strict data processing agreements. These providers are prohibited from using your data to train their own models without explicit consent.`
            },
            {
              title: '4. Data Access Controls',
              body: `Access to user data is strictly limited to authorized Articulate AI personnel who require it to perform their job functions. All access is logged and audited. We implement role-based access control (RBAC) to minimize unnecessary data exposure within our own systems.`
            },
            {
              title: '5. Incident Response',
              body: `In the event of a data breach, we will notify affected users within 72 hours of becoming aware of the breach, as required by applicable data protection regulations. Our security team conducts regular penetration testing and vulnerability assessments to proactively identify and address risks.`
            },
            {
              title: '6. Data Deletion',
              body: `You can request deletion of your account and all associated personal data at any time by contacting support@articulate-ai.app. We will process your request within 30 days. Note that some anonymized aggregate data (with no personally identifiable information) may be retained for service improvement purposes.`
            },
            {
              title: '7. Third-Party Sharing',
              body: `We do not sell your data. We share data with third parties only when necessary to operate the Service (e.g., cloud hosting, AI processing), and only under strict contractual obligations that prohibit secondary use. A list of our key sub-processors is available upon request.`
            },
            {
              title: '8. Regulatory Compliance',
              body: `Articulate AI is committed to complying with applicable data protection laws including GDPR (for EU users) and other regional privacy regulations. If you are located in a jurisdiction with specific data rights, you may contact us to exercise those rights.`
            },
          ].map((section) => (
            <section key={section.title} style={{ borderLeft: '2px solid rgba(16,185,129,0.3)', paddingLeft: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#6ee7b7', marginBottom: '0.6rem' }}>{section.title}</h2>
              <p style={{ color: '#94a3b8', lineHeight: 1.8, fontSize: '0.875rem', margin: 0 }}>{section.body}</p>
            </section>
          ))}
        </div>

        <div style={{ marginTop: '4rem', padding: '1.5rem', borderRadius: '16px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '0.8rem', margin: 0 }}>
            Data safety questions? Email us at <a href="mailto:support@articulate-ai.app" style={{ color: '#34d399', textDecoration: 'none' }}>support@articulate-ai.app</a>
          </p>
        </div>
      </div>
    </div>
  );
}

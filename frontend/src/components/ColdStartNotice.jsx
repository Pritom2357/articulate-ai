import { IS_RENDER_BACKEND } from '../utils/apiClient.js';

// Only renders when the frontend is pointed at the Render-hosted backend, which
// spins down after inactivity — warns users up front instead of a confusing failure.
export default function ColdStartNotice({ language = 'en' }) {
  if (!IS_RENDER_BACKEND) return null;

  return (
    <div
      className="glass-alert"
      style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.3)', color: '#fbbf24' }}
    >
      <span style={{ fontSize: '1.2rem' }}></span>
      <span>
        {language === 'bn'
          ? 'আমাদের সার্ভার কিছুক্ষণ নিষ্ক্রিয় থাকলে "ঘুমিয়ে" যায়। প্রথম রিকোয়েস্টে ৩০-৫০ সেকেন্ড সময় লাগতে পারে — একটু ধৈর্য ধরুন।'
          : 'Our server may be "sleeping" after inactivity — the first request can take 30-50 seconds to wake up. Please be patient.'}
      </span>
    </div>
  );
}

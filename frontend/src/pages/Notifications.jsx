import { useState, useEffect } from 'react';
import { Bell, Award, BookOpen, Zap, Trash2, ShieldAlert } from 'lucide-react';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/progress/notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      if (!response.ok) throw new Error('Failed to load notifications');
      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error(err);
      setError('Notifications could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'badge':
        return <Award className="text-pink-400" size={20} />;
      case 'lesson':
        return <BookOpen className="text-indigo-400" size={20} />;
      case 'chapter':
        return <Award className="text-cyan-400" size={20} />;
      case 'test':
        return <Zap className="text-amber-400" size={20} />;
      case 'xp':
        return <Zap className="text-yellow-400" size={20} />;
      default:
        return <Bell className="text-slate-400" size={20} />;
    }
  };

  if (loading) {
    return <div className="page-container text-center py-20 text-slate-500">Loading notifications...</div>;
  }

  return (
    <div className="page-container" style={{ maxWidth: '800px' }}>
      <div className="page-header border-b border-white/10 pb-4 mb-6">
        <div>
          <h1 className="page-title text-indigo-400 flex items-center gap-2">
            <Bell /> Notifications
          </h1>
          <p className="page-subtitle text-slate-400">
            আপনার সাম্প্রতিক অর্জন, ব্যাজ এবং এক্টিভিটি আপডেটগুলো দেখুন।
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={clearAll}
            className="px-3 py-2 bg-white/5 border border-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5"
          >
            <Trash2 size={13} /> Clear all
          </button>
        )}
      </div>

      {error && (
        <div className="glass-alert glass-alert-error mb-4 flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`card-card p-4 flex gap-4 items-start transition ${
              notif.read ? 'opacity-85' : 'border-indigo-500/20 bg-indigo-950/5'
            }`}
          >
            <div className="p-2 rounded-xl bg-white/5 border border-white/5 flex-shrink-0 mt-0.5">
              {getIcon(notif.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-white text-sm">{notif.title}</h3>
                <span className="text-[10px] text-slate-500 whitespace-nowrap">
                  {new Date(notif.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">{notif.description}</p>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="empty-state py-16">
            <div className="text-4xl mb-3">🔔</div>
            <h3 className="font-bold text-white text-sm">No notifications yet</h3>
            <p className="text-xs text-slate-500 mt-1">We will notify you when you complete lessons, earn badges, or gain XP!</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Bell, Award, BookOpen, Zap, Trash2, ShieldAlert, CheckCheck } from 'lucide-react';
import {
  getNotifications,
  markAllNotificationsRead,
  deleteAllNotifications,
  deleteNotification,
  markNotificationRead
} from '../api/progress.js';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  // Fetch when filter changes
  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      // The backend handles the filtering and sorting for us now!
      const data = await getNotifications({ limit: 50, filter });
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
      setError('Notifications could not be loaded. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = async () => {
    try {
      await deleteAllNotifications();
      setNotifications([]);
      window.dispatchEvent(new Event('notifications_updated'));
    } catch (err) {
      console.error('Failed to clear notifications', err);
      setError('Could not clear notifications.');
    }
  };

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
      window.dispatchEvent(new Event('notifications_updated'));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const deleteOne = async (e, id) => {
    e.stopPropagation(); // prevent clicking the card
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.notification_id !== id));
      window.dispatchEvent(new Event('notifications_updated'));
    } catch (err) {
      console.error('Failed to delete notification', err);
    }
  };

  const markOneAsRead = async (id, currentStatus) => {
    if (currentStatus === 'READ') return;
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n =>
        n.notification_id === id ? { ...n, status: 'READ' } : n
      ));
      window.dispatchEvent(new Event('notifications_updated'));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'BADGE_UNLOCKED':
        return <Award className="text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.3)]" size={20} />;
      case 'LESSON_COMPLETE':
        return <BookOpen className="text-indigo-400 drop-shadow-[0_0_8px_rgba(129,140,248,0.3)]" size={20} />;
      case 'CHAPTER_COMPLETE':
      case 'LEVEL_UP':
      case 'STREAK_MILESTONE':
        return <Award className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]" size={20} />;
      case 'TEST_COMPLETE':
        return <Zap className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" size={20} />;
      case 'XP_EARNED':
        return <Zap className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]" size={20} />;
      default:
        return <Bell className="text-slate-400" size={20} />;
    }
  };

  const getTypeColorClass = (type) => {
    switch (type) {
      case 'BADGE_UNLOCKED':
        return 'border-l-4 border-pink-500';
      case 'LESSON_COMPLETE':
        return 'border-l-4 border-indigo-500';
      case 'CHAPTER_COMPLETE':
      case 'LEVEL_UP':
      case 'STREAK_MILESTONE':
        return 'border-l-4 border-cyan-500';
      case 'TEST_COMPLETE':
        return 'border-l-4 border-amber-500';
      case 'XP_EARNED':
        return 'border-l-4 border-yellow-500';
      default:
        return 'border-l-4 border-slate-500';
    }
  };

  if (loading && notifications.length === 0) {
    return (
      <div className="page-container text-center py-20">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
        <div className="text-slate-400 font-semibold">Loading notifications...</div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: '800px' }}>
      <div className="page-header border-b border-white/10 pb-4 mb-6">
        <div>
          <h1 className="page-title flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center">
              <Bell className="text-indigo-400" size={24} />
            </span>
            Notifications
          </h1>
          <p className="page-subtitle text-slate-400">
            আপনার সাম্প্রতিক অর্জন, ব্যাজ এবং এক্টিভিটি আপডেটগুলো দেখুন।
          </p>
        </div>

        <div className="flex gap-2">
          {notifications.some(n => n.status === 'UNREAD') && (
            <button
              onClick={markAllRead}
              className="px-3.5 py-2 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-300 hover:text-indigo-100 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-sm"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="px-3.5 py-2 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 hover:text-rose-100 rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 size={13} /> Clear all
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="glass-alert glass-alert-error mb-6 flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6 p-1.5 rounded-2xl bg-slate-900/40 border border-white/5 backdrop-blur-md">
        {['ALL', 'UNREAD', 'READ'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer border-none ${filter === tab
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
          >
            {tab} Updates
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {notifications.map(notif => (
          <div
            key={notif.notification_id}
            onClick={() => markOneAsRead(notif.notification_id, notif.status)}
            className={`card-card p-4 flex gap-4 items-start transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_15px_30px_rgba(99,102,241,0.06)] relative group overflow-hidden cursor-pointer ${getTypeColorClass(notif.type)} ${notif.status === 'UNREAD'
                ? 'bg-indigo-900/20 shadow-[inset_0_0_15px_rgba(99,102,241,0.1)]'
                : 'bg-slate-900/40 opacity-70 saturate-50'
              }`}
          >
            {/* Visual glow indicator for unread */}
            {notif.status === 'UNREAD' && (
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full filter blur-xl pointer-events-none"></div>
            )}

            <div className={`p-2.5 rounded-xl border flex-shrink-0 mt-0.5 shadow-inner transition-all ${notif.status === 'UNREAD' ? 'bg-white/10 border-white/10' : 'bg-white/5 border-white/5'
              }`}>
              {getIcon(notif.type)}
            </div>

            <div className="flex-grow min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h3 className={`font-extrabold text-base tracking-wide flex items-center gap-2 ${notif.status === 'UNREAD' ? 'text-white' : 'text-slate-300'
                  }`}>
                  {notif.subject}
                  {notif.status === 'UNREAD' && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse"></span>
                  )}
                </h3>
                <span className="text-[10px] text-slate-500 font-bold bg-white/5 border border-white/5 rounded px-2 py-0.5 whitespace-nowrap">
                  {new Date(notif.sent_time || Date.now()).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <p className={`text-sm leading-relaxed mt-1.5 font-medium ${notif.status === 'UNREAD' ? 'text-slate-200' : 'text-slate-400'
                }`}>{notif.description}</p>
            </div>

            <button
              onClick={(e) => deleteOne(e, notif.notification_id)}
              className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-200 border-none bg-transparent"
              title="Delete notification"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        {!loading && notifications.length === 0 && (
          <div className="empty-state py-16 animate-fade-in border border-dashed border-white/10 bg-slate-950/20">
            <div className="text-5xl mb-4 animate-bounce">🔔</div>
            <h3 className="font-extrabold text-white text-base">No notifications found</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
              We will notify you here when you complete lessons, earn badges, or gain XP to progress through the curriculum!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

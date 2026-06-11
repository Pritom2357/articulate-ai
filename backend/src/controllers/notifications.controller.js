const ProgressModel = require('../models/progress.model')

class NotificationsController {
    constructor() {
        this.progressModel = new ProgressModel()
    }

    getUserNotifications = async (req, res) => {
        try {
            const userId = req.user.id;
            const xpLogsQuery = `
                SELECT log_id, amount, reason, created_at
                FROM user_xp_log
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT 10;
            `;
            const xpLogs = await this.progressModel.db_connection.query_executor(xpLogsQuery, [userId]);

            const notifications = [
                {
                    id: 'welcome',
                    title: 'Welcome to Articulate AI! 🎉',
                    description: 'আপনার ইংরেজি শেখার যাত্রা আজই শুরু করুন। গাইড টিউটর নির্বাচন করে অনবোর্ডিং সম্পন্ন করুন।',
                    created_at: new Date(Date.now() - 3600000 * 24),
                    type: 'system',
                    read: true
                }
            ];

            for (const log of xpLogs.rows) {
                let title = 'XP Gained! ⚡';
                let desc = `You earned +${log.amount} XP for ${log.reason.replace('_', ' ')}.`;
                let type = 'xp';

                if (log.reason === 'lesson_complete') {
                    title = 'Lesson Completed! 📚';
                    desc = `লেসন শেষ করে আপনি +${log.amount} XP অর্জন করেছেন।`;
                    type = 'lesson';
                } else if (log.reason === 'chapter_complete') {
                    title = 'Chapter Unlocked! 🏆';
                    desc = `চ্যাপ্টার সম্পন্ন করে আপনি +${log.amount} XP বোনাস পেয়েছেন।`;
                    type = 'chapter';
                } else if (log.reason === 'test_complete' || log.reason === 'test_completed') {
                    title = 'Speaking Evaluation Done! 🎙️';
                    desc = `উচ্চারণ পরীক্ষায় অংশ নিয়ে +${log.amount} XP অর্জন করেছেন।`;
                    type = 'test';
                }

                notifications.push({
                    id: `log_${log.log_id}`,
                    title,
                    description: desc,
                    created_at: log.created_at,
                    type,
                    read: false
                });
            }

            const badgeQuery = `
                SELECT ub.badge_id, ub.earned_at, b.title, b.description
                FROM user_badges ub
                JOIN badges b ON ub.badge_id = b.badge_id
                WHERE ub.user_id = $1
                ORDER BY ub.earned_at DESC;
            `;
            const badges = await this.progressModel.db_connection.query_executor(badgeQuery, [userId]);

            for (const badge of badges.rows) {
                notifications.push({
                    id: `badge_${badge.badge_id}`,
                    title: `Badge Unlocked: ${badge.title} 🎖️`,
                    description: `${badge.description} (অভিনন্দন! নতুন ব্যাজ অর্জিত হয়েছে)`,
                    created_at: badge.earned_at,
                    type: 'badge',
                    read: false
                });
            }

            notifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            return res.status(200).json({ success: true, notifications });
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
}

module.exports = NotificationsController;

const NotificationModel = require('../models/notifications.model.js');
const { Pool } = require('pg');
const bus = require('../events/eventBus.js');
const Events = require('../events/eventsNames.js');

class NotificationService {
    constructor(pushAdapter) {
        this.push = pushAdapter;
        this.model = new NotificationModel();
        this.enablePush = process.env.ENABLE_PUSH_NOTIFICATIONS === 'true';

        this.setupPgListener();
        this.registerSystemListeners();
    }

    //  connects directly to PG to listen for trigger events
    setupPgListener = async () => {
        if (!this.enablePush || !this.push) return; // exit if push notifications are disabled globally or no socket adapter exists

        // Check if the database requires an SSL connection 
        const useSSL = process.env.DB_SSL === 'true' || (process.env.DATABASE_URL || '').includes('sslmode=require');

        // create a separate PG connection pool just for listening
        this.listenerPool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ...(useSSL ? { ssl: { rejectUnauthorized: false } } : {})
        });

        const client = await this.listenerPool.connect(); // dedicated client connection from the new pool

        client.on('error', (err) => {
            console.error('PG listener client error:', err.message);
        });

        bus.on(Events.USER_PROFILE_UPDATED, ({ userId, changed }) => {
            if (this.enablePush) this.push?.pushToUser(userId, 'profile_updated', { changed });
        });

        bus.on(Events.PASSWORD_RESET_REQUESTED, ({ userId, email }) => {
            if (this.enablePush) this.push?.pushToUser(userId, 'password_reset_requested', { email });
        });

        bus.on(Events.PASSWORD_CHANGED, ({ userId }) => {
            if (this.enablePush) this.push?.pushToUser(userId, 'password_changed', { message: 'Password updated' });
        });

        // Badge unlocked event
        bus.on(Events.BADGE_UNLOCKED, ({ userId, badge_id, title, description, xp_reward, icon_url, earned_at }) => {
            if (this.enablePush) {
                this.push?.pushToUser(userId, 'badge_earned', {
                    badge_id,
                    title,
                    description,
                    xp_reward,
                    icon_url,
                    earned_at
                });
            }
        });

        //  built-in event listener provided by the 'pg' library
        // fires every time the PG sends any 'NOTIFY' event to this client
        client.on('notification', async (msg) => {
            if (msg.channel === 'new_notification') {
                const notificationId = parseInt(msg.payload); // msg.payload contains the notification_id we passed from the SQL trigger

                await this.handleRealtimePush(notificationId); // push via socket.io
            }
        });

        client.query('LISTEN new_notification');
        console.log('👂 Listening for PG new_notification events');
    }


    handleRealtimePush = async (notificationId) => {
        try {
            const notif = await this.model.getById(notificationId);
            if (!notif) return;

            // push to the specific user via Socket.IO
            this.push.pushToUser(notif.user_id, 'notification', notif);
        } catch (error) {
            console.error('Error handling realtime push:', error);
        }
    }

    // system events that aren't tied to DB triggers
    registerSystemListeners = () => {
        bus.on(Events.USER_REGISTERED, async ({ userId, email, username }) => {
            await this.model.create(userId, {
                type: 'SYSTEM',
                subject: 'Welcome to Articulate AI! 🎉',
                description: `স্বাগতম ${username}! আপনার ইংরেজি শেখার যাত্রা আজই শুরু করুন।`,
                metadata: { email }
            });
        });

        bus.on(Events.USER_EMAIL_VERIFIED, async ({ userId, email }) => {
            await this.model.create(userId, {
                type: 'SYSTEM',
                subject: 'Email Verified ✅',
                description: `আপনার ইমেইল ${email} সফলভাবে যাচাই হয়েছে।`,
                metadata: { email }
            });
        });

        bus.on(Events.USER_PROFILE_UPDATED, async ({ userId, changed }) => {
            await this.model.create(userId, {
                type: 'GENERAL',
                subject: 'Profile Updated ✏️',
                description: 'আপনার প্রোফাইল সফলভাবে আপডেট হয়েছে।',
                metadata: { changed }
            });
        });

        bus.on(Events.PASSWORD_CHANGED, async ({ userId }) => {
            await this.model.create(userId, {
                type: 'SYSTEM',
                subject: 'Password Changed 🔒',
                description: 'আপনার পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে।',
            });
        });
    }
}

module.exports = NotificationService;
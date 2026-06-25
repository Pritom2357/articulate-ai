const NotificationModel = require('../models/notifications.model');

class NotificationsController {
    constructor() {
        this.model = new NotificationModel();
    }

    getUserNotifications = async (req, res) => {
        try {
            const userId = req.user.id
            const limit = Math.min(parseInt(req.query.limit) || 30, 100)
            const offset = parseInt(req.query.offset) || 0
            const filter = (req.query.filter || 'ALL').toUpperCase()

            const [notifications, unreadCount] = await Promise.all([
                this.model.getByUserId(userId, { limit, offset, filter }),
                this.model.getUnreadCount(userId),
            ])

            return res.status(200).json({
                success: true,
                notifications,
                unreadCount,
                pagination: { limit, offset }
            })
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }


    getUnreadCount = async (req, res) => {
        try {
            const count = await this.model.getUnreadCount(req.user.id)

            return res.status(200).json({ success: true, count })
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }


    markAsRead = async (req, res) => {
        try {
            const notification = await this.model.markAsRead(req.user.id, req.params.id)

            if (!notification) return res.status(404).json({ success: false, error: 'Notification not found' })

            return res.status(200).json({ success: true, notification })
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }

    markAllAsRead = async (req, res) => {
        try {
            const count = await this.model.markAllAsRead(req.user.id)

            return res.status(200).json({ success: true, markedCount: count })
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }

    deleteOne = async (req, res) => {
        try {
            const deleted = await this.model.deleteOne(req.user.id, req.params.id)

            if (!deleted) return res.status(404).json({ success: false, error: 'Notification not found' })

            return res.status(200).json({ success: true })
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }

    deleteAll = async (req, res) => {
        try {
            const count = await this.model.deleteAll(req.user.id)

            return res.status(200).json({ success: true, deletedCount: count })
        } catch (error) {
            return res.status(500).json({ success: false, error: 'Internal server error' })
        }
    }
}

module.exports = NotificationsController
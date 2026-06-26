const DB_Connection = require('../database/db')

class NotificationModel {
    constructor() {
        this.db = DB_Connection.getInstance()
    }

    // for notifications not tied to triggers (e.g. Welcome)
    create = async (userId, { type, subject, description, metadata = {}, multicast = null }) => {
        try {
            const query = `
                INSERT INTO notifications (user_id, type, subject, description, metadata, multicast, status)
                VALUES ($1, $2, $3, $4, $5, $6, 'UNREAD') RETURNING *;
            `

            const params = [
                userId,
                type,
                subject,
                description,
                JSON.stringify(metadata),
                multicast
            ]
            const result = await this.db.query_executor(query, params)
            return result.rows[0] || null
        } catch (error) {
            throw new Error(`Failed to create notification: ${error.message}`)
        }
    }


    getById = async (notificationId) => {
        try {
            const query = `
                SELECT * FROM notifications 
                WHERE notification_id = $1
            `
            const result = await this.db.query_executor(query, [notificationId])

            return result.rows[0] || null
        } catch (error) {
            throw new Error(`Failed to fetch notification: ${error.message}`)
        }
    }


    getByUserId = async (userId, { limit = 30, offset = 0, filter = 'ALL' } = {}) => {
        try {
            let whereClause = ''
            if (filter === 'UNREAD') whereClause += ` AND status = 'UNREAD'`
            else if (filter === 'READ') whereClause += ` AND status = 'READ'`

            const query = `
                SELECT * FROM notifications 
                WHERE user_id = $1
                    ${whereClause} 
                ORDER BY 
                    CASE WHEN status = 'UNREAD' THEN 0 ELSE 1 END ASC,
                    sent_time DESC 
                LIMIT $2 OFFSET $3;
            `

            const params = [userId, limit, offset]
            const result = await this.db.query_executor(query, params)

            return result.rows || []
        } catch (error) {
            throw new Error(`Failed to fetch notifications: ${error.message}`)
        }
    }


    getUnreadCount = async (userId) => {
        try {
            const query = `
                SELECT COUNT(*) AS count 
                FROM notifications 
                WHERE user_id = $1 AND status = 'UNREAD'
            `
            const result = await this.db.query_executor(query, [userId])

            return result.rows[0].count || 0;
        } catch (error) {
            throw new Error(`Failed to fetch unread count: ${error.message}`)
        }
    }


    markAsRead = async (userId, notificationId) => {
        try {
            const query = `
                UPDATE notifications 
                SET status = 'READ' 
                WHERE notification_id = $1 AND user_id = $2 
                RETURNING *
            `

            const params = [notificationId, userId]
            const result = await this.db.query_executor(query, params)

            return result.rows[0] || null
        } catch (error) {
            throw new Error(`Failed to mark as read: ${error.message}`)
        }
    }


    markAllAsRead = async (userId) => {
        try {
            const query = `
                UPDATE notifications 
                SET status = 'READ' 
                WHERE user_id = $1 AND status = 'UNREAD'
                RETURNING *
            `

            const params = [userId]
            const result = await this.db.query_executor(query, params)

            return result.rowCount || 0
        } catch (error) {
            throw new Error(`Failed to mark all as read: ${error.message}`)
        }
    }


    deleteOne = async (userId, notificationId) => {
        try {
            const query = `
                DELETE FROM notifications 
                WHERE notification_id = $1 AND user_id = $2
                RETURNING notification_id
            `

            const params = [notificationId, userId]
            const result = await this.db.query_executor(query, params)

            return result.rowCount > 0
        } catch (error) {
            throw new Error(`Failed to delete notification: ${error.message}`)
        }
    }


    deleteAll = async (userId) => {
        try {
            const query = `
                DELETE FROM notifications 
                WHERE user_id = $1 
                RETURNING notification_id
            `
            const params = [userId]
            const result = await this.db.query_executor(query, params)

            return result.rowCount || 0
        } catch (error) {
            throw new Error(`Failed to delete all notifications: ${error.message}`)
        }
    }
}

module.exports = NotificationModel

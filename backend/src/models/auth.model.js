const DB_Connection = require('../database/db.js')

class AuthModel {
    constructor() {
        this.db_connection = DB_Connection.getInstance()
    }


    /////////////// create & update //////////////////////
    createUser = async (userData) => {
        try {
            const { name, email, passwordHash, phone, gender, date_of_birth } = userData;

            const query = `
                INSERT INTO users (name, email, password_hash, phone, gender, date_of_birth)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, name, email, phone, gender, date_of_birth, role, is_active, mic_verified, created_at;
            `
            const params = [name, email, passwordHash, phone, gender ?? null, date_of_birth ?? null]
            const result = await this.db_connection.query_executor(query, params)

            const userId = result.rows[0].id

            // create user progress
            const progressQuery = `
                INSERT INTO user_progress (user_id)
                VALUES ($1);
            `
            await this.db_connection.query_executor(progressQuery, [userId])

            return result.rows[0]
        } catch (error) {
            throw new Error(`User creation failed: ${error.message}`)
        }
    }


    getUserByEmail = async (email) => {
        try {
            const query = `
                SELECT * FROM users
                WHERE email = $1
                LIMIT 1;
            `;

            const result = await this.db_connection.query_executor(query, [email]);

            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`Couldn't find user: ${error.message}`)
        }
    };


    setLastLogin = async (userId) => {
        const query = `
        UPDATE users
        SET last_login = NOW()
        WHERE id = $1;
    `;

        await this.db_connection.query_executor(query, [userId]);
    };


    findByRefreshToken = async (token) => {
        const query = `
        SELECT * FROM users
        WHERE refresh_token = $1
        LIMIT 1;
    `;

        const result = await this.db_connection.query_executor(query, [token]);
        return result.rows[0] || null;
    };


    ///////////////// checks //////////////////////
    isEmailTaken = async (email) => {
        try {
            const query = `
                SELECT COUNT(id) as cnt FROM users 
                WHERE email = $1;
            `

            const params = [email]
            const result = await this.db_connection.query_executor(query, params)

            return parseInt(result.rows[0].cnt) > 0
        } catch (error) {
            throw new Error(`is email taken checking failed: ${error.message}`)
        }
    }


    isPhoneTaken = async (phone) => {
        try {
            const query = `
                SELECT COUNT(id) AS cnt
                FROM users
                WHERE phone = $1;
            `

            const params = [phone]
            const result = await this.db_connection.query_executor(query, params)

            return parseInt(result.rows[0].cnt) > 0
        } catch (error) {
            throw new Error(`Phone check failed: ${error.message}`)
        }
    }


    // token related parts
    updateRefreshToken = async (userId, refreshToken) => {
        try {
            const query = `
                UPDATE users 
                SET
                    refresh_token = $2,
                    updated_at = NOW()
                WHERE id = $1
                `

            const params = [userId, refreshToken]
            await this.db_connection.query_executor(query, params)
        } catch (error) {
            throw new Error(`Updation of refresh token failed: ${error.message}`)
        }
    }


    clearRefreshToken = async (userId) => {
        try {
            const query = `
                UPDATE users 
                SET
                    refresh_token = NULL,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING id
            `

            const params = [userId]
            const result = await this.db_connection.query_executor(query, params)
            return result.rows[0] || null
        } catch (error) {
            throw new Error(`Failed to clear refresh token: ${error.message}`)
        }
    }

}

module.exports = AuthModel
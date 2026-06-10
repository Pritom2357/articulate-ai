const DB_Connection = require('../database/db.js')

class UserModel {
    constructor() {
        this.db_connection = new DB_Connection()
    }


    ///////////// find ////////
    getUserById = async (userId) => {
        try {
            const query = `
                SELECT id, name, email, phone, gender, date_of_birth, role, is_active, profile_photo, mic_verified, mic_quality_score, guide_preference, created_at, updated_at
                FROM users
                WHERE id = $1
                LIMIT 1;
            `

            const params = [userId]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows[0] || null
        } catch (error) {
            throw new Error(`Couldn't find user: ${error.message}`)
        }
    }


    getUserByEmail = async (email) => {
        try {
            const query = `
                SELECT * FROM users
                WHERE email = $1
                LIMIT 1;
            `
            const params = [email]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows[0] || null
        } catch (error) {
            throw new Error(`Couldn't find user: ${error.message}`)
        }
    }


    findByRefreshToken = async (refreshToken) => {
        try {
            const query = `
                SELECT id, name, email, role, is_active
                FROM users
                WHERE refresh_token = $1 AND is_active = TRUE
                LIMIT 1;
            `
            const params = [refreshToken]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows[0] || null
        } catch (error) {
            throw new Error(`Finding by refresh token failed: ${error.message}`)
        }
    }


    updateUser = async (userId, updates) => {
        try {
            if (!updates || Object.keys(updates).length === 0) {
                throw new Error("No updates were sent from frontend");
            }
            if (updates.date_of_birth === "") updates.date_of_birth = null;
            if (updates.gender === "") updates.gender = null;
            if (updates.gender) updates.gender = updates.gender.toUpperCase();
            const allowed = new Set(["name", "phone", "gender", "date_of_birth", "guide_preference"]);
            const sets = [];
            const values = [];
            let idx = 1;

            for (const [key, value] of Object.entries(updates)) {
                if (!allowed.has(key)) continue;

                sets.push(`${key} = $${idx++}`);
                values.push(value);
            }

            if (sets.length === 0) {
                throw new Error("No valid value was sent");
            }

            sets.push(`updated_at = NOW()`);
            values.push(userId);

            const query = `
                UPDATE users
                SET ${sets.join(', ')}
                WHERE id = $${idx}
                RETURNING id, name, email, phone, gender, date_of_birth, role, is_active, profile_photo, guide_preference, updated_at;
            `;

            const result = await this.db_connection.query_executor(query, values);

            return result.rows[0] || null;
        } catch (error) {
            throw new Error(`User updation failed: ${error.message}`);
        }
    }


    deleteUser = async (userId) => {
        try {
            const query = `
                DELETE FROM users
                WHERE id = $1
                RETURNING id
            `

            const params = [userId]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows[0]
        } catch (error) {
            throw new Error(`Couldn't delete user: ${error.message}`)
        }
    }


    deactivateUser = async (userId) => {
        try {
            const query = `
                UPDATE users
                SET
                    is_active = FALSE,
                    refresh_token = NULL,
                    updated_at = NOW()
                WHERE id = $1
                RETURNING id, is_active;
            `

            const params = [userId]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows[0] || null
        } catch (error) {
            throw new Error(`User deactivation failed: ${error.message}`)
        }
    }


    setLastLogin = async (userId) => {
        try {
            const query = `
                UPDATE users
                SET last_login = NOW()
                WHERE id = $1
                RETURNING id
            `

            const params = [userId]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows[0]
        } catch (error) {
            throw new Error(`Couldn't set last login: ${error.message}`)
        }
    }


    updatePassword = async (userId, newPasswordHash) => {
        try {
            const query = `
                UPDATE users
                SET
                    password_hash = $1,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING id
            `

            const params = [newPasswordHash, userId]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows[0] || null
        } catch (error) {
            throw new Error(`Password updation  failed: ${error.message}`)
        }
    }


    setProfilePhoto = async (userId, photoUrl) => {
        try {
            const query = `
                UPDATE users
                SET profile_photo = $1,
                    updated_at = NOW()
                WHERE id = $2
                RETURNING id, profile_photo;
            `

            // expects a plain URL string — unwrap Cloudinary's secure_url in the controller
            const params = [photoUrl, userId]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows[0] || null
        } catch (error) {
            throw new Error(`Profile photo update failed: ${error.message}`)
        }
    }


    updateMicStatus = async (userId, micVerified, micQualityScore) => {
        try {
            const query = `
                UPDATE users
                SET
                    mic_verified = $1,
                    mic_quality_score = $2,
                    updated_at = NOW()
                WHERE id = $3
                RETURNING id, mic_verified, mic_quality_score;
            `

            const params = [micVerified, micQualityScore, userId]
            const result = await this.db_connection.query_executor(query, params)

            return result.rows[0] || null
        } catch (error) {
            throw new Error(`Mic status update failed: ${error.message}`)
        }
    }

}

module.exports = UserModel
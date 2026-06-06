const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AuthModel = require('../models/auth.model.js');
const { uploadAvatarBuffer } = require('../utils/cloudinary.js');

class AuthController {
    constructor() {
        this.authModel = new AuthModel();
        this.salt_round = parseInt(process.env.PASSWORD_SALT_ROUNDS) || 12;
        this.access_token_secret = process.env.JWT_ACCESS_SECRET;
        this.refresh_token_secret = process.env.JWT_REFRESH_SECRET;
        this.access_token_expiry = process.env.ACCESS_TOKEN_TTL || '15m';
        this.refresh_token_expiry = process.env.REFRESH_TOKEN_DAYS || '7d';
    }

    generateTokens = (user) => {
        const accessPayload = {
            sub: user.id,
            name: user.name,
            email: user.email,
            role: user.role
        };

        const accessToken = jwt.sign(accessPayload, this.access_token_secret, { expiresIn: this.access_token_expiry });
        const refreshToken = jwt.sign({ sub: user.id }, this.refresh_token_secret, { expiresIn: this.refresh_token_expiry });

        return { accessToken, refreshToken };
    };


    ///////// authorization ///////////////
    register = async (req, res) => {
        try {
            const { name, email, password, phone, gender, date_of_birth } = req.body || {};

            if (!name || !email || !password || !phone) {
                return res.status(400).json({ success: false, error: 'Name, email, password, and phone are required' });
            }

            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    error: 'Password must be at least 6 characters'
                })
            }

            const emailTaken = await this.authModel.isEmailTaken(email);
            if (emailTaken) {
                return res.status(409).json({ success: false, error: 'Email already taken' });
            }

            const phoneTaken = await this.authModel.isPhoneTaken(phone);
            if (phoneTaken) {
                return res.status(409).json({ success: false, error: 'Phone number already taken' });
            }

            const passwordHash = await bcrypt.hash(password, this.salt_round);

            const newUser = await this.authModel.createUser({
                name,
                email,
                passwordHash,
                phone,
                gender: gender || null,
                date_of_birth: date_of_birth || null
            });

            if (!newUser) {
                return res.status(500).json({ success: false, error: "Failed to create new user" });
            }

            const { accessToken, refreshToken } = this.generateTokens(newUser);
            await this.authModel.updateRefreshToken(newUser.id, refreshToken);

            return res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user: newUser,
                tokens: { accessToken, refreshToken }
            });

        } catch (error) {
            console.error('Registration error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error during registration' });
        }
    };


    login = async (req, res) => {
        try {
            const { email, password } = req.body || {};
            if (!email || !password) {
                return res.status(400).json({ success: false, error: 'Email and password are required' });
            }

            const user = await this.authModel.getUserByEmail(email);
            if (!user) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }

            if (!user.is_active) {
                return res.status(403).json({ success: false, error: 'Account is deactivated' });
            }

            const match = await bcrypt.compare(password, user.password_hash);
            if (!match) {
                return res.status(401).json({ success: false, error: 'Invalid credentials' });
            }

            await this.authModel.setLastLogin(user.id);

            const { accessToken, refreshToken } = this.generateTokens(user);
            await this.authModel.updateRefreshToken(user.id, refreshToken);

            // Ignore password_hash before sending
            const { password_hash, ...safeUser } = user;

            return res.status(200).json({
                success: true,
                message: 'Login successful',
                user: safeUser,
                tokens: { accessToken, refreshToken }
            });
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error during login' });
        }
    };


    logout = async (req, res) => {
        try {
            const userId = req.user?.id || req.body?.userId || req.params?.userId;
            if (!userId) {
                return res.status(400).json({ success: false, error: 'Access Denied' });
            }

            await this.authModel.clearRefreshToken(userId);

            return res.status(200).json({ success: true, message: 'Logged out successfully' });
        } catch (error) {
            console.error('Logout error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error during logout' });
        }
    };


    refreshTokens = async (req, res) => {
        try {
            const { refreshToken } = req.body || {};
            if (!refreshToken) {
                return res.status(400).json({ success: false, error: 'Refresh token is required' });
            }

            const user = await this.authModel.findByRefreshToken(refreshToken);
            if (!user) {
                return res.status(401).json({ success: false, error: 'Invalid refresh token' });
            }

            const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);
            await this.authModel.updateRefreshToken(user.id, newRefreshToken);

            return res.status(200).json({
                success: true,
                tokens: { accessToken, refreshToken: newRefreshToken }
            });
        } catch (error) {
            console.error('Refresh token error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error during token refresh' });
        }
    };


    //////////// profile /////////////////
    getProfile = async (req, res) => {
        try {
            const userId = parseInt(req.user?.id || req.params.userId);
            if (!userId) {
                return res.status(400).json({ success: false, error: 'User ID is required' });
            }

            const user = await this.authModel.getUserById(userId);
            if (!user) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            return res.status(200).json({ success: true, user });
        } catch (error) {
            console.error('Get profile error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };


    updateProfile = async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            if (!userId) {
                return res.status(400).json({ success: false, error: 'User ID is required' });
            }

            if (req.user && userId !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({ success: false, error: "You are not authorized to update this profile" });
            }

            const updatedUser = await this.authModel.updateUser(userId, req.body || {});

            if (!updatedUser) {
                return res.status(400).json({ success: false, error: 'Update failed' })
            }

            const { password_hash, ...safeUser } = updatedUser;

            return res.status(200).json({ success: true, user: safeUser });
        } catch (error) {
            console.error('Update profile error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };


    changePassword = async (req, res) => {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({ success: false, error: 'Unauthorized' });
            }

            if (!oldPassword || !newPassword) {
                return res.status(400).json({ success: false, error: 'Old password and new password are required' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, error: 'New password must be at least 6 characters long' });
            }

            // Using getUserById to get simple profile info and handle basic checks
            const profile = await this.authModel.getUserById(userId);
            if (!profile) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            // Using getUserByEmail which returns password_hash to verify old password
            const user = await this.authModel.getUserByEmail(profile.email);

            const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
            if (!isOldPasswordValid) {
                return res.status(400).json({ success: false, error: 'Invalid old password' });
            }

            const isSameOldPassword = await bcrypt.compare(newPassword, user.password_hash);
            if (isSameOldPassword) {
                return res.status(400).json({ success: false, error: "Same as old password, provide a new one" });
            }

            const pass_hash = await bcrypt.hash(newPassword, this.salt_round);
            await this.authModel.updatePassword(userId, pass_hash);

            return res.status(200).json({ success: true, message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };


    uploadProfilePhoto = async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);
            if (!userId) {
                return res.status(400).json({ success: false, error: 'userId param required' });
            }

            if (req.user && userId !== req.user.id) {
                return res.status(403).json({ success: false, error: 'Forbidden' });
            }

            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No file was provided' });
            }

            const maxSize = parseInt(process.env.MAX_AVATAR_SIZE_BYTES) || 2097152;
            if (req.file.size > maxSize) {
                return res.status(400).json({ success: false, error: 'File too large (max 2MB)' });
            }

            if (!/^image\/(png|jpe?g|webp)$/i.test(req.file.mimetype)) {
                return res.status(400).json({ success: false, error: 'Only png, jpg, jpeg, webp allowed' });
            }

            // Assumes uploadAvatarBuffer returns a cloudinary URL or an object with secure_url
            const result = await uploadAvatarBuffer(req.file.buffer, userId);
            const photoUrl = result.secure_url || result;

            const updatedUser = await this.authModel.setProfilePhoto(userId, photoUrl);

            if (!updatedUser) {
                return res.status(500).json({ success: false, error: 'Failed to update profile photo' });
            }

            return res.status(200).json({
                success: true,
                message: 'Profile photo updated',
                profile_photo: updatedUser.profile_photo
            });
        } catch (error) {
            console.error('Profile photo upload error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };


    // // given by claude but needs AI implementation. So skipped for now
    // updateMicStatus = async (req, res) => {
    //     try {
    //         const userId = parseInt(req.params.userId)
    //         if (!userId) {
    //             return res.status(400).json({ success: false, error: 'userId param required' })
    //         }

    //         if (userId !== req.user.id && req.user.role !== 'ADMIN') {
    //             return res.status(403).json({ success: false, error: 'Forbidden' })
    //         }

    //         const { mic_verified, mic_quality_score } = req.body || {}
    //         if (mic_verified === undefined || mic_quality_score === undefined) {
    //             return res.status(400).json({ success: false, error: 'mic_verified and mic_quality_score are required' })
    //         }

    //         const updated = await this.authModel.updateMicStatus(userId, mic_verified, mic_quality_score)
    //         if (!updated) {
    //             return res.status(500).json({ success: false, error: 'Failed to update mic status' })
    //         }

    //         return res.status(200).json({ success: true, ...updated })
    //     } catch (error) {
    //         console.error('Update mic status error:', error.message)
    //         return res.status(500).json({ success: false, error: 'Internal server error' })
    //     }
    // }


    /////////// Deletions ///////////
    deactivateAccount = async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);

            if (req.user && userId !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({ success: false, error: "Forbidden" });
            }

            const deactivatedUser = await this.authModel.deactivateUser(userId);
            if (!deactivatedUser) {
                return res.status(404).json({ success: false, error: 'User not found or already deactivated' });
            }

            return res.status(200).json({ success: true, message: 'Account deactivated successfully' });
        } catch (error) {
            console.error('Account deactivation error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };

    deleteAccount = async (req, res) => {
        try {
            const userId = parseInt(req.params.userId);

            if (req.user && req.user.role !== 'ADMIN' && userId !== req.user.id) {
                return res.status(403).json({ success: false, error: "Forbidden" });
            }

            const deletedUID = await this.authModel.deleteUser(userId);
            if (!deletedUID) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            return res.status(200).json({ success: true, message: 'Account deleted successfully' });
        } catch (error) {
            console.error('Account deletion error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    };
}

module.exports = AuthController;

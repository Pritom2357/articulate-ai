const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model.js');
const { uploadAvatarBuffer } = require('../utils/cloudinary.js');

class UserController {
    constructor() {
        this.userModel = new UserModel();
        this.salt_round = parseInt(process.env.PASSWORD_SALT_ROUNDS) || 12;
        this.access_token_secret = process.env.JWT_ACCESS_SECRET;
        this.refresh_token_secret = process.env.JWT_REFRESH_SECRET;
        this.access_token_expiry = process.env.ACCESS_TOKEN_TTL || '15m';
        this.refresh_token_expiry = process.env.REFRESH_TOKEN_DAYS || '7d';
    }


    //////////// profile /////////////////
    getProfile = async (req, res) => {
        try {
            const userId = parseInt(req.user?.id || req.params.userId);
            if (!userId) {
                return res.status(400).json({ success: false, error: 'User ID is required' });
            }

            const user = await this.userModel.getUserById(userId);
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

            const updatedUser = await this.userModel.updateUser(userId, req.body || {});

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
            const profile = await this.userModel.getUserById(userId);
            if (!profile) {
                return res.status(404).json({ success: false, error: 'User not found' });
            }

            // Using getUserByEmail which returns password_hash to verify old password
            const user = await this.userModel.getUserByEmail(profile.email);

            const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password_hash);
            if (!isOldPasswordValid) {
                return res.status(400).json({ success: false, error: 'Invalid old password' });
            }

            const isSameOldPassword = await bcrypt.compare(newPassword, user.password_hash);
            if (isSameOldPassword) {
                return res.status(400).json({ success: false, error: "Same as old password, provide a new one" });
            }

            const pass_hash = await bcrypt.hash(newPassword, this.salt_round);
            await this.userModel.updatePassword(userId, pass_hash);

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

            const updatedUser = await this.userModel.setProfilePhoto(userId, photoUrl);

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

    //         const updated = await this.userModel.updateMicStatus(userId, mic_verified, mic_quality_score)
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

            const deactivatedUser = await this.userModel.deactivateUser(userId);
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

            const deletedUID = await this.userModel.deleteUser(userId);
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

module.exports = UserController;
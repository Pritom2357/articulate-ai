const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AuthModel = require('../models/auth.model.js');

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
}

module.exports = AuthController;
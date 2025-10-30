const { User } = require('../models');
const { Op } = require('sequelize');
const validator = require('fastest-validator');
const v = new validator();
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

const loginSchema = {
    password: {
        type: "string", min: 6,
        message: {
            required: "Password is required"
        }
    }
};

module.exports = {
    async login(req, res) {
        try {
            const { username, password } = req.body;

            const validation = v.validate(req.body, loginSchema);
            if (validation !== true) {
                return res.status(400).json({
                    status: "error",
                    error: true,
                    message: validation
                });
            }

            const user = await User.findOne({
                where: {
                    [Op.or]: [
                        { email: username },
                        { username: username },
                        { phone: username },
                    ]
                }
            });

            if (!user) {
                return res.status(401).json({
                    status: "error",
                    error: true,
                    message: "Incorrect username/email/phone or password."
                });
            }

            if (user.status === 'in_active') {
                return res.status(403).json({
                    status: "error",
                    error: true,
                    message: "Your account has been deactivated. Please contact support."
                });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({
                    status: "error",
                    error: true,
                    message: "Incorrect username/email/phone or password."
                });
            }

            await user.update({ last_login: new Date() });
            await user.reload();

            const token = jwt.sign(
                {
                    user_id: user.id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_KEY || 'secret',
                { expiresIn: "7d" }
            );

            res.status(200).json({
                status: "success",
                error: false,
                message: 'Login successfully.',
                data: {
                    user: {
                        id: user.id,
                        full_name: user.full_name,
                        username: user.username,
                        email: user.email,
                        phone: user.phone,
                        profile: user.profile,
                        role: user.role,
                        status: user.status,
                        last_login: user.last_login,
                    },
                    token
                }
            });
        } catch (error) {
            res.status(500).json({
                status: "error",
                error: true,
                message: "An unexpected error occurred during login. Please try again later.",
                details: error.message
            });
        }
    },

    async logout(req, res) {
        try {
            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'Logout successful.',
            });
        } catch (error) {
            console.error('Error during logout:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'An unexpected error occurred during logout.',
            });
        }
    },

    async verifyToken(req, res, next) {
        try {
            const authHeader = req.headers['authorization'];

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({
                    status: 'error',
                    error: true,
                    message: 'Access denied. No token provided.',
                });
            }

            const token = authHeader.split(' ')[1];

            jwt.verify(token, process.env.JWT_KEY || 'secret', (err, decoded) => {
                if (err) {
                    return res.status(401).json({
                        status: 'error',
                        error: true,
                        message: 'Invalid or expired token.',
                    });
                }

                req.user = decoded;
                next();
            });
        } catch (error) {
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'Something went wrong while verifying token.',
                details: error.message,
            });
        }
    }
};
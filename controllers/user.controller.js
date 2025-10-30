const { User, sequelize } = require("../models");
const bcrypt = require("bcryptjs");

module.exports = {
    /**
     * 🟢 Create new user
     */
    async createUser(req, res) {
        try {
            const { full_name, username, email, phone, role, password, status, profile } = req.body;

            const existingUser = await User.findOne({ where: { email } });
            if (existingUser) {
                return res.status(400).json({
                    status: 'error',
                    error: true,
                    message: 'អ៊ីមែលនេះមានរួចហើយ!',
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newUser = await User.create({
                full_name,
                username,
                email,
                phone,
                role: role || 'user',
                status: status || 'active',
                profile: profile || null,
                password: hashedPassword,
            });

            return res.status(201).json({
                status: 'success',
                error: false,
                message: 'បន្ថែមអ្នកប្រើប្រាស់បានជោគជ័យ',
                data: newUser,
            });
        } catch (error) {
            console.error('Create user error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលបន្ថែមអ្នកប្រើប្រាស់',
                details: error.message,
            });
        }
    },

    /**
     * 🟡 Get all users (with optional search & paging)
     */
    async getAllUsers(req, res) {
        try {
            const { page = 1, size = 10, search = '' } = req.query;
            const offset = (page - 1) * size;

            const whereClause = search
                ? {
                    [sequelize.Op.or]: [
                        sequelize.where(sequelize.fn('LOWER', sequelize.col('full_name')), 'LIKE', `%${search.toLowerCase()}%`),
                        sequelize.where(sequelize.fn('LOWER', sequelize.col('email')), 'LIKE', `%${search.toLowerCase()}%`),
                        sequelize.where(sequelize.fn('LOWER', sequelize.col('username')), 'LIKE', `%${search.toLowerCase()}%`),
                    ],
                }
                : {};

            const { count, rows } = await User.findAndCountAll({
                where: whereClause,
                limit: parseInt(size),
                offset: parseInt(offset),
                order: [['createdAt', 'DESC']],
                attributes: { exclude: ['password'] },
            });

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកបញ្ជីអ្នកប្រើប្រាស់បានជោគជ័យ',
                data: rows,
                paging: {
                    size: parseInt(size),
                    page: parseInt(page),
                    totalPage: Math.ceil(count / size),
                    total: count,
                },
            });
        } catch (error) {
            console.error('Get users error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកអ្នកប្រើប្រាស់',
                details: error.message,
            });
        }
    },

    /**
     * 🟢 Get one user by ID
     */
    async getOneUser(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: `មិនមានអ្នកប្រើប្រាស់ដែលមាន id = ${id} ទេ`,
                });
            }

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកព័ត៌មានអ្នកប្រើប្រាស់បានជោគជ័យ',
                data: user,
            });
        } catch (error) {
            console.error('Get one user error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកអ្នកប្រើប្រាស់',
                details: error.message,
            });
        }
    },

    /**
     * 🟠 Update user info
     */
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { full_name, username, email, phone, role, status, profile } = req.body;

            const user = await User.findByPk(id);
            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: `មិនមានអ្នកប្រើប្រាស់ដែលមាន id = ${id} ទេ`,
                });
            }

            await user.update({
                full_name,
                username,
                email,
                phone,
                role,
                status,
                profile,
            });

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ធ្វើបច្ចុប្បន្នភាពអ្នកប្រើប្រាស់បានជោគជ័យ',
                data: user,
            });
        } catch (error) {
            console.error('Update user error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលធ្វើបច្ចុប្បន្នភាពអ្នកប្រើប្រាស់',
                details: error.message,
            });
        }
    },

    /**
     * 🔴 Delete user
     */
    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findByPk(id);

            if (!user) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: `មិនមានអ្នកប្រើប្រាស់ដែលមាន id = ${id} ទេ`,
                });
            }

            await user.destroy();

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'លុបអ្នកប្រើប្រាស់បានជោគជ័យ',
            });
        } catch (error) {
            console.error('Delete user error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលលុបអ្នកប្រើប្រាស់',
                details: error.message,
            });
        }
    },
};

const { sequelize } = require('../models');
const { body, validationResult } = require('express-validator');
const moment = require('moment');
module.exports = {
    /**
     * Begin:: Validate grade fields
     */
    validateGrade: [
        body('grade_name').notEmpty().withMessage('Grade name is required'),
        body('description').optional().isString().withMessage('Description must be a string'),
    ],
    /**
     * End:: Validate grade fields
     */

    /**
     * Begin:: Create grade
     */
    async createGrade(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 'error',
                    error: true,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
            }

            const { grade_name, description } = req.body;

            const [result] = await sequelize.query(
                `INSERT INTO "Grades" ("grade_name", "description", "createdAt", "updatedAt")
         VALUES (:grade_name, :description, NOW(), NOW())
         RETURNING *;`,
                {
                    replacements: { grade_name, description },
                    type: sequelize.QueryTypes.INSERT
                }
            );

            return res.status(201).json({
                status: 'success',
                error: false,
                message: 'បន្ថែមថ្នាក់ជោគជ័យ',
                data: result[0],
            });

        } catch (error) {
            console.error('Create grade error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលបន្ថែមថ្នាក់',
                details: error.message,
            });
        }
    },
    /**
     * End:: Create grade
     */

    /**
     * Begin:: Get all grades
     */
    async getAllGrades(req, res) {
        try {
            const {
                page = 1,
                size = 10,
                search = '',
                startDate,
                endDate,
            } = req.query;

            const limit = parseInt(size);
            const offset = (parseInt(page) - 1) * limit;

            let whereClauses = [];
            let replacements = {};

            if (search) {
                whereClauses.push(`("grade_name" ILIKE :search OR "description" ILIKE :search)`);
                replacements.search = `%${search}%`;
            }

            if (startDate && endDate) {
                const formattedStart = moment(startDate.trim(), 'DD-MMM-YYYY').format('YYYY-MM-DD');
                const formattedEnd = moment(endDate.trim(), 'DD-MMM-YYYY').format('YYYY-MM-DD');

                whereClauses.push(`DATE("createdAt") BETWEEN :startDate AND :endDate`);
                replacements.startDate = formattedStart;
                replacements.endDate = formattedEnd;
            }

            const whereQuery = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

            const [totalResult] = await sequelize.query(
                `SELECT COUNT(*) AS total FROM "Grades";`,
                { type: sequelize.QueryTypes.SELECT }
            );
            const total = parseInt(totalResult.total);

            const [countResult] = await sequelize.query(
                `SELECT COUNT(*) AS total FROM "Grades" ${whereQuery};`,
                { replacements, type: sequelize.QueryTypes.SELECT }
            );
            const totalPage = Math.ceil(parseInt(countResult.total) / limit);

            const grades = await sequelize.query(
                `
            SELECT * FROM "Grades"
            ${whereQuery}
            ORDER BY "createdAt" DESC
            LIMIT :limit OFFSET :offset;
            `,
                {
                    replacements: { ...replacements, limit, offset },
                    type: sequelize.QueryTypes.SELECT,
                }
            );

            const formattedGrades = grades.map((g) => ({
                ...g,
                createdAt: moment(g.createdAt).format('DD-MMM-YYYY'),
                updatedAt: moment(g.updatedAt).format('DD-MMM-YYYY'),
            }));

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកបញ្ជីថ្នាក់បានជោគជ័យ',
                data: formattedGrades,
                paging: {
                    size: limit,
                    page: parseInt(page),
                    totalPage,
                    total,
                },
            });

        } catch (error) {
            console.error('Get all grades error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកថ្នាក់',
                details: error.message,
            });
        }
    },
    /**
     * End:: Get all grades
     */

    /**
     * Begin:: Get one grade
     */
    async getOneGrade(req, res) {
        try {
            const { id } = req.params;

            const [grade] = await sequelize.query(
                'SELECT * FROM "Grades" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            if (!grade) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានថ្នាក់នេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកថ្នាក់បានជោគជ័យ',
                data: grade,
            });

        } catch (error) {
            console.error('Get one grade error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកថ្នាក់',
                details: error.message,
            });
        }
    },
    /**
     * End:: Get one grade
     */

    /**
     * Begin:: Update grade
     */
    async updateGrade(req, res) {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 'error',
                    error: true,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
            }

            const { id } = req.params;
            const { grade_name, description } = req.body;

            const [gradeExist] = await sequelize.query(
                'SELECT * FROM "Grades" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            if (!gradeExist) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានថ្នាក់នេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            const fieldsToUpdate = {};
            if (grade_name) fieldsToUpdate.grade_name = grade_name;
            if (description !== undefined) fieldsToUpdate.description = description;

            const setClause = Object.keys(fieldsToUpdate)
                .map(key => `"${key}" = :${key}`)
                .join(', ');

            await sequelize.query(
                `UPDATE "Grades" SET ${setClause}, "updatedAt" = NOW() WHERE "id" = :id;`,
                { replacements: { ...fieldsToUpdate, id } }
            );

            const [updatedGrade] = await sequelize.query(
                'SELECT * FROM "Grades" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'កែប្រែថ្នាក់ជោគជ័យ',
                data: updatedGrade,
            });

        } catch (error) {
            console.error('Update grade error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលកែប្រែថ្នាក់',
                details: error.message,
            });
        }
    },
    /**
     * End:: Update grade
     */

    /**
     * Begin:: Delete grade
     */
    async deleteGrade(req, res) {
        try {
            const { id } = req.params;

            const [gradeExist] = await sequelize.query(
                'SELECT * FROM "Grades" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            if (!gradeExist) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានថ្នាក់នេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            await sequelize.query(
                'DELETE FROM "Grades" WHERE "id" = :id;',
                { replacements: { id } }
            );

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'លុបថ្នាក់បានជោគជ័យ',
            });

        } catch (error) {
            console.error('Delete grade error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលលុបថ្នាក់',
                details: error.message,
            });
        }
    },
    /**
     * End:: Delete grade
     */
};

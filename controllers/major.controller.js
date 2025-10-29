const { sequelize } = require('../models');
const { body, validationResult } = require('express-validator');
const moment = require('moment');
module.exports = {
    /**
     * Begin:: Validate major fields
     */
    validateMajor: [
        body('major_name').notEmpty().withMessage('Major name is required'),
        body('major_type').notEmpty().withMessage('Major type is required'),
    ],
    /**
     * End:: Validate major fields
     */

    /**
     * Begin:: Create major
     */
    async createMajor(req, res) {
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

            const { major_name, major_type } = req.body;

            const [result] = await sequelize.query(
                `INSERT INTO "Majors" ("major_name", "major_type", "createdAt", "updatedAt")
         VALUES (:major_name, :major_type, NOW(), NOW())
         RETURNING *;`,
                {
                    replacements: { major_name, major_type },
                    type: sequelize.QueryTypes.INSERT
                }
            );

            return res.status(201).json({
                status: 'success',
                error: false,
                message: 'បន្ថែមមុខជំនាញជោគជ័យ',
                data: result[0],
            });

        } catch (error) {
            console.error('Create major error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលបន្ថែមមុខជំនាញ',
                details: error.message,
            });
        }
    },
    /**
     * End:: Create major
     */

    /**
     * Begin:: Get all majors
     */
    async getAllMajors(req, res) {
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
                whereClauses.push(`("major_name" ILIKE :search OR "major_type" ILIKE :search)`);
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
                `SELECT COUNT(*) AS total FROM "Majors";`,
                { type: sequelize.QueryTypes.SELECT }
            );
            const total = parseInt(totalResult.total);

            const [countResult] = await sequelize.query(
                `SELECT COUNT(*) AS total FROM "Majors" ${whereQuery};`,
                {
                    replacements,
                    type: sequelize.QueryTypes.SELECT,
                }
            );

            const totalPage = Math.ceil(parseInt(countResult.total) / limit);

            const majors = await sequelize.query(
                `
            SELECT * FROM "Majors"
            ${whereQuery}
            ORDER BY "createdAt" DESC
            LIMIT :limit OFFSET :offset;
            `,
                {
                    replacements: { ...replacements, limit, offset },
                    type: sequelize.QueryTypes.SELECT,
                }
            );

            const formattedMajors = majors.map((m) => ({
                ...m,
                createdAt: moment(m.createdAt).format('DD-MMM-YYYY'),
                updatedAt: moment(m.updatedAt).format('DD-MMM-YYYY'),
            }));

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកបញ្ជីមុខជំនាញបានជោគជ័យ',
                data: formattedMajors,
                paging: {
                    size: limit,
                    page: parseInt(page),
                    totalPage,
                    total,
                },
            });

        } catch (error) {
            console.error('Get all majors error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកមុខជំនាញ',
                details: error.message,
            });
        }
    },
    /**
     * End:: Get all majors
     */

    /**
     * Begin:: Get one major
     */
    async getOneMajor(req, res) {
        try {
            const { id } = req.params;

            const [major] = await sequelize.query(
                'SELECT * FROM "Majors" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            if (!major) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានមុខជំនាញនេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកមុខជំនាញបានជោគជ័យ',
                data: major,
            });

        } catch (error) {
            console.error('Get one major error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកមុខជំនាញ',
                details: error.message,
            });
        }
    },
    /**
     * End:: Get one major
     */

    /**
     * Begin:: Update major
     */
    async updateMajor(req, res) {
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
            const { major_name, major_type } = req.body;

            const [majorExist] = await sequelize.query(
                'SELECT * FROM "Majors" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            if (!majorExist) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានមុខជំនាញនេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            const fieldsToUpdate = {};
            if (major_name) fieldsToUpdate.major_name = major_name;
            if (major_type) fieldsToUpdate.major_type = major_type;

            const setClause = Object.keys(fieldsToUpdate)
                .map(key => `"${key}" = :${key}`)
                .join(', ');

            await sequelize.query(
                `UPDATE "Majors" SET ${setClause}, "updatedAt" = NOW() WHERE "id" = :id;`,
                { replacements: { ...fieldsToUpdate, id } }
            );

            const [updatedMajor] = await sequelize.query(
                'SELECT * FROM "Majors" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'កែប្រែមុខជំនាញជោគជ័យ',
                data: updatedMajor,
            });

        } catch (error) {
            console.error('Update major error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលកែប្រែមុខជំនាញ',
                details: error.message,
            });
        }
    },
    /**
     * End:: Update major
     */

    /**
     * Begin:: Delete major
     */
    async deleteMajor(req, res) {
        try {
            const { id } = req.params;

            const [majorExist] = await sequelize.query(
                'SELECT * FROM "Majors" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            if (!majorExist) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានមុខជំនាញនេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            await sequelize.query(
                'DELETE FROM "Majors" WHERE "id" = :id;',
                { replacements: { id } }
            );

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'លុបមុខជំនាញបានជោគជ័យ',
            });

        } catch (error) {
            console.error('Delete major error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលលុបមុខជំនាញ',
                details: error.message,
            });
        }
    },
    /**
     * End:: Delete major
     */
};

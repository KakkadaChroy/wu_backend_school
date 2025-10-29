const { sequelize } = require('../models');
const { body, validationResult } = require('express-validator');
const moment = require('moment');

module.exports = {
    /**
     * Begin:: Validate schedule fields
     */
    validateSchedule: [
        body('schedule_list').notEmpty().withMessage('Schedule list is required'),
        body('description').optional().isString().withMessage('Description must be a string'),
    ],
    /**
     * End:: Validate schedule fields
     */

    /**
     * Begin:: Create schedule
     */
    async createSchedule(req, res) {
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

            const { schedule_list, description } = req.body;

            const [result] = await sequelize.query(
                `INSERT INTO "Schedules" ("schedule_list", "description", "createdAt", "updatedAt")
         VALUES (:schedule_list, :description, NOW(), NOW())
         RETURNING *;`,
                {
                    replacements: { schedule_list, description },
                    type: sequelize.QueryTypes.INSERT
                }
            );

            return res.status(201).json({
                status: 'success',
                error: false,
                message: 'បន្ថែមកាលវិភាគជោគជ័យ',
                data: result[0],
            });

        } catch (error) {
            console.error('Create schedule error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលបន្ថែមកាលវិភាគ',
                details: error.message,
            });
        }
    },
    /**
     * End:: Create schedule
     */

    /**
     * Begin:: Get all schedules
     */
    async getAllSchedules(req, res) {
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
                whereClauses.push(`("schedule_list" ILIKE :search OR "description" ILIKE :search)`);
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
                `SELECT COUNT(*) AS total FROM "Schedules";`,
                { type: sequelize.QueryTypes.SELECT }
            );
            const total = parseInt(totalResult.total);

            const [countResult] = await sequelize.query(
                `SELECT COUNT(*) AS total FROM "Schedules" ${whereQuery};`,
                { replacements, type: sequelize.QueryTypes.SELECT }
            );
            const totalPage = Math.ceil(parseInt(countResult.total) / limit);

            const schedules = await sequelize.query(
                `
            SELECT * FROM "Schedules"
            ${whereQuery}
            ORDER BY "createdAt" DESC
            LIMIT :limit OFFSET :offset;
            `,
                {
                    replacements: { ...replacements, limit, offset },
                    type: sequelize.QueryTypes.SELECT,
                }
            );

            const formattedSchedules = schedules.map((s) => ({
                ...s,
                createdAt: moment(s.createdAt).format('DD-MMM-YYYY'),
                updatedAt: moment(s.updatedAt).format('DD-MMM-YYYY'),
            }));

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកបញ្ជីកាលវិភាគបានជោគជ័យ',
                data: formattedSchedules,
                paging: {
                    size: limit,
                    page: parseInt(page),
                    totalPage,
                    total,
                },
            });

        } catch (error) {
            console.error('Get all schedules error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកកាលវិភាគ',
                details: error.message,
            });
        }
    },
    /**
     * End:: Get all schedules
     */

    /**
     * Begin:: Get one schedule
     */
    async getOneSchedule(req, res) {
        try {
            const { id } = req.params;

            const [schedule] = await sequelize.query(
                'SELECT * FROM "Schedules" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            if (!schedule) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានកាលវិភាគនេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកកាលវិភាគបានជោគជ័យ',
                data: schedule,
            });

        } catch (error) {
            console.error('Get one schedule error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកកាលវិភាគ',
                details: error.message,
            });
        }
    },
    /**
     * End:: Get one schedule
     */

    /**
     * Begin:: Update schedule
     */
    async updateSchedule(req, res) {
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
            const { schedule_list, description } = req.body;

            const [scheduleExist] = await sequelize.query(
                'SELECT * FROM "Schedules" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            if (!scheduleExist) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានកាលវិភាគនេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            const fieldsToUpdate = {};
            if (schedule_list) fieldsToUpdate.schedule_list = schedule_list;
            if (description !== undefined) fieldsToUpdate.description = description;

            const setClause = Object.keys(fieldsToUpdate)
                .map(key => `"${key}" = :${key}`)
                .join(', ');

            await sequelize.query(
                `UPDATE "Schedules" SET ${setClause}, "updatedAt" = NOW() WHERE "id" = :id;`,
                { replacements: { ...fieldsToUpdate, id } }
            );

            const [updatedSchedule] = await sequelize.query(
                'SELECT * FROM "Schedules" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'កែប្រែកាលវិភាគជោគជ័យ',
                data: updatedSchedule,
            });

        } catch (error) {
            console.error('Update schedule error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលកែប្រែកាលវិភាគ',
                details: error.message,
            });
        }
    },
    /**
     * End:: Update schedule
     */

    /**
     * Begin:: Delete schedule
     */
    async deleteSchedule(req, res) {
        try {
            const { id } = req.params;

            const [scheduleExist] = await sequelize.query(
                'SELECT * FROM "Schedules" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            if (!scheduleExist) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានកាលវិភាគនេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            await sequelize.query(
                'DELETE FROM "Schedules" WHERE "id" = :id;',
                { replacements: { id } }
            );

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'លុបកាលវិភាគបានជោគជ័យ',
            });

        } catch (error) {
            console.error('Delete schedule error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលលុបកាលវិភាគ',
                details: error.message,
            });
        }
    },
    /**
     * End:: Delete schedule
     */
};

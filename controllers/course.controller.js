const { sequelize } = require('../models');
const { body, validationResult } = require('express-validator');
const moment = require('moment');
module.exports = {
    /**
     * Begin:: Validate course fields
     */
    validateCourse: [
        body('name').notEmpty().withMessage('Course name is required'),
        body('start_date').notEmpty().withMessage('Start date is required').isDate().withMessage('Start date must be a valid date'),
        body('end_date').notEmpty().withMessage('End date is required').isDate().withMessage('End date must be a valid date'),
        body('duration').notEmpty().withMessage('Duration is required'),
        body('description').optional().isString().withMessage('Description must be a string'),
    ],
    /**
     * End:: Validate course fields
     */

    /**
     * Begin:: Create course
     */
    async createCourse(req, res) {
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

            const { name, description, start_date, end_date, duration } = req.body;

            const formattedStartDate = moment(start_date, 'DD-MM-YYYY').format('YYYY-MM-DD');
            const formattedEndDate = moment(end_date, 'DD-MM-YYYY').format('YYYY-MM-DD');

            const [result] = await sequelize.query(
                `INSERT INTO "Courses" ("name", "description", "start_date", "end_date", "duration", "createdAt", "updatedAt")
       VALUES (:name, :description, :start_date, :end_date, :duration, NOW(), NOW())
       RETURNING *;`,
                {
                    replacements: {
                        name,
                        description,
                        start_date: formattedStartDate,
                        end_date: formattedEndDate,
                        duration
                    },
                    type: sequelize.QueryTypes.INSERT
                }
            );

            return res.status(201).json({
                status: 'success',
                error: false,
                message: 'បន្ថែមវគ្គសិក្សាជោគជ័យ',
                data: result[0],
            });
        } catch (error) {
            console.error('Create course error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលបន្ថែមវគ្គសិក្សា',
                details: error.message,
            });
        }
    },
    /**
     * End:: Create course
     */

    /**
     * Begin:: Get all courses
     */
    async getAllCourses(req, res) {
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
                whereClauses.push(`("name" ILIKE :search OR "description" ILIKE :search)`);
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
                `SELECT COUNT(*) AS total FROM "Courses";`,
                { type: sequelize.QueryTypes.SELECT }
            );
            const total = parseInt(totalResult.total);

            const [countResult] = await sequelize.query(
                `SELECT COUNT(*) AS total FROM "Courses" ${whereQuery};`,
                { replacements, type: sequelize.QueryTypes.SELECT }
            );
            const totalPage = Math.ceil(parseInt(countResult.total) / limit);

            const courses = await sequelize.query(
                `
            SELECT * FROM "Courses"
            ${whereQuery}
            ORDER BY "createdAt" DESC
            LIMIT :limit OFFSET :offset;
            `,
                {
                    replacements: { ...replacements, limit, offset },
                    type: sequelize.QueryTypes.SELECT,
                }
            );

            const formattedCourses = courses.map((c) => ({
                ...c,
                createdAt: moment(c.createdAt).format('DD-MMM-YYYY'),
                updatedAt: moment(c.updatedAt).format('DD-MMM-YYYY'),
            }));

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកបញ្ជីវគ្គសិក្សាបានជោគជ័យ',
                data: formattedCourses,
                paging: {
                    size: limit,
                    page: parseInt(page),
                    totalPage,
                    total,
                },
            });

        } catch (error) {
            console.error('Get all courses error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកវគ្គសិក្សា',
                details: error.message,
            });
        }
    },
    /**
     * End:: Get all courses
     */


    /**
     * Begin:: Get one course
     */
    async getOneCourse(req, res) {
        try {
            const { id } = req.params;

            const [course] = await sequelize.query(
                'SELECT * FROM "Courses" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            if (!course) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានវគ្គសិក្សានេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            // ✅ Format date fields
            course.start_date = course.start_date
                ? moment(course.start_date).format('DD-MM-YYYY')
                : null;

            course.end_date = course.end_date
                ? moment(course.end_date).format('DD-MM-YYYY')
                : null;

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកវគ្គសិក្សាបានជោគជ័យ',
                data: course,
            });

        } catch (error) {
            console.error('Get one course error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកវគ្គសិក្សា',
                details: error.message,
            });
        }
    },
    /**
     * End:: Get one course
     */

    /**
     * Begin:: Update course
     */
    async updateCourse(req, res) {
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
            const { name, description, start_date, end_date, duration } = req.body;

            const [courseExist] = await sequelize.query(
                'SELECT * FROM "Courses" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            if (!courseExist) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានវគ្គសិក្សានេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            const fieldsToUpdate = {};
            if (name) fieldsToUpdate.name = name;
            if (description !== undefined) fieldsToUpdate.description = description;

            if (start_date) {
                const formattedStart = moment(start_date, 'DD-MM-YYYY').format('YYYY-MM-DD');

                if (moment(formattedStart).isBefore(moment(), 'day')) {
                    return res.status(400).json({
                        status: 'error',
                        error: true,
                        message: 'ថ្ងៃចាប់ផ្តើមត្រូវតែជាពេលអនាគត ឬថ្ងៃបច្ចុប្បន្ន',
                    });
                }

                fieldsToUpdate.start_date = formattedStart;
            }

            if (end_date) {
                const formattedEnd = moment(end_date, 'DD-MM-YYYY').format('YYYY-MM-DD');
                fieldsToUpdate.end_date = formattedEnd;
            }

            if (duration) fieldsToUpdate.duration = duration;

            if (Object.keys(fieldsToUpdate).length === 0) {
                return res.status(400).json({
                    status: 'error',
                    error: true,
                    message: 'គ្មានទិន្នន័យត្រូវកែប្រែ',
                });
            }

            const setClause = Object.keys(fieldsToUpdate)
                .map(key => `"${key}" = :${key}`)
                .join(', ');

            await sequelize.query(
                `UPDATE "Courses" SET ${setClause}, "updatedAt" = NOW() WHERE "id" = :id;`,
                { replacements: { ...fieldsToUpdate, id } }
            );

            const [updatedCourse] = await sequelize.query(
                'SELECT * FROM "Courses" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'កែប្រែវគ្គសិក្សាជោគជ័យ',
                data: updatedCourse,
            });

        } catch (error) {
            console.error('Update course error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលកែប្រែវគ្គសិក្សា',
                details: error.message,
            });
        }
    },
    /**
     * End:: Update course
     */

    /**
     * Begin:: Delete course
     */
    async deleteCourse(req, res) {
        try {
            const { id } = req.params;

            const [courseExist] = await sequelize.query(
                'SELECT * FROM "Courses" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            if (!courseExist) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានវគ្គសិក្សានេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            await sequelize.query(
                'DELETE FROM "Courses" WHERE "id" = :id;',
                { replacements: { id } }
            );

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'លុបវគ្គសិក្សាបានជោគជ័យ',
            });

        } catch (error) {
            console.error('Delete course error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលលុបវគ្គសិក្សា',
                details: error.message,
            });
        }
    },
    /**
     * End:: Delete course
     */
};

const {sequelize} = require('../models');
const {body, validationResult} = require('express-validator');
const moment = require('moment');
module.exports = {
    /**
     * Begin:: Validate student fields
     */
    validateStudent: [
        body('first_name').notEmpty().withMessage('First name is required'),
        body('last_name').notEmpty().withMessage('Last name is required'),
        body('dob').notEmpty().withMessage('Date of birth is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('phone').notEmpty().withMessage('Phone number is required'),
    ],

    validateUpdateStudent: [
        body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
        body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
        body('dob').optional().notEmpty().withMessage('Date of birth cannot be empty'),
        body('email').optional().isEmail().withMessage('Valid email is required'),
        body('phone').optional().notEmpty().withMessage('Phone number cannot be empty'),
        body('gender').optional().notEmpty().withMessage('Gender cannot be empty'),
        body('age').optional().isInt().withMessage('Age must be a number'),
        body('status').optional().isIn(['pending', 'confirmed']).withMessage('Invalid status'),
    ],
    /**
     * End:: Validate student fields
     */

    /**
     * Begin:: Create student function (Raw SQL version, PostgreSQL)
     */
    async createStu(req, res) {
        try {
            /**
             * Begin:: Check validation errors
             */
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 'error',
                    error: true,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
            }
            /**
             * End:: Check validation errors
             */

            /**
             * Begin:: Extract data from request
             */
            const {
                first_name,
                last_name,
                dob,
                phone,
                email,
                gender,
                age,
                status,
            } = req.body;
            /**
             * End:: Extract data from request
             */

            /**
             * Begin:: Get last student ID (stu_id)
             */
            const [lastStudent] = await sequelize.query(
                'SELECT "stu_id" FROM "Students" ORDER BY "createdAt" DESC LIMIT 1;',
                {type: sequelize.QueryTypes.SELECT}
            );

            let nextId = 1;
            if (lastStudent) {
                nextId = lastStudent.stu_id + 1;
            }
            /**
             * End:: Get last student ID (stu_id)
             */

            /**
             * Begin:: Insert new student record
             */
            await sequelize.query(
                `
                INSERT INTO "Students" 
                ("stu_id", "first_name", "last_name", "dob", "phone", "email", "gender", "age", "status", "createdAt", "updatedAt")
                VALUES (:stu_id, :first_name, :last_name, :dob, :phone, :email, :gender, :age, :status, NOW(), NOW());
                `,
                {
                    replacements: {
                        stu_id: nextId,
                        first_name,
                        last_name,
                        dob,
                        phone,
                        email,
                        gender,
                        age,
                        status,
                    },
                }
            );
            /**
             * End:: Insert new student record
             */

            /**
             * Begin:: Fetch inserted student
             */
            const [student] = await sequelize.query(
                'SELECT * FROM "Students" WHERE "stu_id" = :stu_id;',
                {
                    replacements: {stu_id: nextId},
                    type: sequelize.QueryTypes.SELECT,
                }
            );
            /**
             * End:: Fetch inserted student
             */

            /**
             * Begin:: Return success response
             */
            return res.status(201).json({
                status: 'success',
                error: false,
                message: 'បន្ថែមសិស្សជោគជ័យ',
                data: student,
            });
            /**
             * End:: Return success response
             */

        } catch (error) {
            /**
             * Begin:: Catch and handle error
             */
            console.error('Create student error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលបន្ថែមសិស្ស',
                details: error.message,
            });
            /**
             * End:: Catch and handle error
             */
        }
    },
    /**
     * End:: Create student function
     */

    /**
     * Begin:: Update student function (Raw SQL, PostgreSQL)
     */
    async updateStu(req, res) {
        try {
            /**
             * Begin:: Check validation errors
             */
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    status: 'error',
                    error: true,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
            }
            /**
             * End:: Check validation errors
             */

            /**
             * Begin:: Extract stu_id and update fields
             */
            const {id} = req.params;
            const {first_name, last_name, dob, phone, email, gender, age, status} = req.body;
            /**
             * End:: Extract stu_id and update fields
             */

            /**
             * Begin:: Check if student exists
             */
            const [studentExist] = await sequelize.query(
                'SELECT * FROM "Students" WHERE "id" = :id;',
                {
                    replacements: {id},
                    type: sequelize.QueryTypes.SELECT,
                }
            );

            if (!studentExist) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានសិស្សនេះនៅក្នុងប្រព័ន្ធ',
                });
            }
            /**
             * End:: Check if student exists
             */

            /**
             * Begin:: Build dynamic update query
             */
            const fieldsToUpdate = {};
            if (first_name) fieldsToUpdate.first_name = first_name;
            if (last_name) fieldsToUpdate.last_name = last_name;
            if (dob) fieldsToUpdate.dob = dob;
            if (phone) fieldsToUpdate.phone = phone;
            if (email) fieldsToUpdate.email = email;
            if (gender) fieldsToUpdate.gender = gender;
            if (age !== undefined) fieldsToUpdate.age = age;
            if (status) fieldsToUpdate.status = status;

            const setClause = Object.keys(fieldsToUpdate)
                .map((key, idx) => `"${key}" = :${key}`)
                .join(', ');

            /**
             * End:: Build dynamic update query
             */

            /**
             * Begin:: Execute update
             */
            await sequelize.query(
                `UPDATE "Students" SET ${setClause}, "updatedAt" = NOW() WHERE "id" = :id;`,
                {
                    replacements: {...fieldsToUpdate, id},
                }
            );
            /**
             * End:: Execute update
             */

            /**
             * Begin:: Fetch updated student
             */
            const [updatedStudent] = await sequelize.query(
                'SELECT * FROM "Students" WHERE "id" = :id;',
                {
                    replacements: {id},
                    type: sequelize.QueryTypes.SELECT,
                }
            );
            /**
             * End:: Fetch updated student
             */

            /**
             * Begin:: Return success response
             */
            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'កែប្រែសិស្សជោគជ័យ',
                data: updatedStudent,
            });
            /**
             * End:: Return success response
             */

        } catch (error) {
            /**
             * Begin:: Catch and handle error
             */
            console.error('Update student error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលកែប្រែសិស្ស',
                details: error.message,
            });
            /**
             * End:: Catch and handle error
             */
        }
    },
    /**
     * End:: Update student function
     */

    /**
     * Begin:: Get all students (with pagination, filters, search, and Khmer date format)
     */
    async getAllStu(req, res) {
        try {
            const {
                page = 1,
                size = 10,
                search = '',
                age,
                status,
                startDate,
                endDate,
            } = req.query;

            const limit = parseInt(size);
            const offset = (parseInt(page) - 1) * limit;

            let whereClauses = [];
            let replacements = {};

            if (search) {
                whereClauses.push(`("first_name" ILIKE :search OR "last_name" ILIKE :search OR "phone" ILIKE :search)`);
                replacements.search = `%${search}%`;
            }

            if (age) {
                whereClauses.push(`"age" = :age`);
                replacements.age = age;
            }

            if (status) {
                whereClauses.push(`"status" = :status`);
                replacements.status = status;
            }

            if (startDate && endDate) {
                const formattedStart = moment(startDate, 'DD-MMM-YYYY').format('YYYY-MM-DD');
                const formattedEnd = moment(endDate, 'DD-MMM-YYYY').format('YYYY-MM-DD');

                whereClauses.push(`DATE("createdAt") BETWEEN :startDate AND :endDate`);
                replacements.startDate = formattedStart;
                replacements.endDate = formattedEnd;
            }

            const whereQuery = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';



            const [countResult] = await sequelize.query(
                `SELECT COUNT(*) AS total FROM "Students" ${whereQuery};`,
                {
                    replacements,
                    type: sequelize.QueryTypes.SELECT,
                }
            );

            const [totalResult] = await sequelize.query(
                `SELECT COUNT(*) AS total FROM "Students";`,
                { type: sequelize.QueryTypes.SELECT }
            );

            const total = parseInt(totalResult.total);
            const totalPage = Math.ceil(total / limit);

            const students = await sequelize.query(
                `
            SELECT * FROM "Students"
            ${whereQuery}
            ORDER BY "createdAt" DESC
            LIMIT :limit OFFSET :offset;
            `,
                {
                    replacements: { ...replacements, limit, offset },
                    type: sequelize.QueryTypes.SELECT,
                }
            );

            const formattedStudents = students.map((stu) => ({
                ...stu,
                createdAt: moment(stu.createdAt).format('DD-MMM-YYYY'),
                updatedAt: moment(stu.updatedAt).format('DD-MMM-YYYY'),
                dob: stu.dob ? moment(stu.dob).format('DD-MMM-YYYY') : null,
            }));

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកបញ្ជីសិស្សបានជោគជ័យ',
                data: formattedStudents,
                paging: {
                    size: limit,
                    page: parseInt(page),
                    totalPage,
                    total,
                },
            });

        } catch (error) {
            console.error('Get all students error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកសិស្ស',
                details: error.message,
            });
        }
    },
    /**
     * End:: Get all students
     */

    async formStudent(req, res) {
        try {
            const statuses = [
                { label: 'Pending', value: 'pending' },
                { label: 'Confirmed', value: 'confirmed' },
            ];

            const genders = [
                { label: 'Male', value: 'male' },
                { label: 'Female', value: 'female' },
                { label: 'Other', value: 'other' },
            ];

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកទិន្នន័យសម្រាប់បញ្ចូលសិស្សបានជោគជ័យ',
                data: {
                    statuses,
                    genders,
                },
            });
        } catch (error) {
            console.error('Form student error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកទិន្នន័យសិស្ស',
                details: error.message,
            });
        }
    },

    /**
     * Begin:: Filter options for Student
     */
    async filterStudent(req, res) {
        try {
            const statuses = [
                { label: 'Pending', value: 'pending' },
                { label: 'Confirmed', value: 'confirmed' },
            ];

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកជម្រើសស្ថានភាពសិស្សបានជោគជ័យ',
                data: { statuses },
            });

        } catch (error) {
            console.error('Filter student error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកជម្រើសស្ថានភាពសិស្ស',
                details: error.message,
            });
        }
    },
    /**
     * End:: Filter options for Student
     */

    /**
     * Begin:: Get one student
     */
    async getOneStu(req, res) {
        try {
            const {stu_id, id} = req.params;

            const [student] = await sequelize.query(
                `
                  SELECT * FROM "Students" 
                  WHERE "stu_id" = :stu_id OR "id" = :id
                  LIMIT 1;
                  `,
                {
                    replacements: {stu_id: stu_id ? parseInt(stu_id) : null, id: id ? parseInt(id) : null},
                    type: sequelize.QueryTypes.SELECT
                }
            );

            if (!student) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានសិស្សនេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកសិស្សបានជោគជ័យ',
                data: student,
            });

        } catch (error) {
            console.error('Get one student error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកសិស្ស',
                details: error.message,
            });
        }
    },
    /**
     * End:: Get one student
     */

    /**
     * Begin:: Delete student
     */
    async deleteStu(req, res) {
        try {
            const { id } = req.params;

            const [studentExist] = await sequelize.query(
                'SELECT * FROM "Students" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            if (!studentExist) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានសិស្សនេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            await sequelize.query(
                'DELETE FROM "Students" WHERE "id" = :id;',
                { replacements: { id } }
            );

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'លុបសិស្សបានជោគជ័យ',
            });

        } catch (error) {
            console.error('Delete student error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលលុបសិស្ស',
                details: error.message,
            });
        }
    },
    /**
     * End:: Delete student
     */
};

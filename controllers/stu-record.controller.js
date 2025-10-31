const {sequelize, Student} = require('../models');
const {body, validationResult} = require('express-validator');
const moment = require('moment');

module.exports = {
    /**
     * Begin:: Validate student record fields
     */
    validateStudentRecord: [
        body('stu_id').notEmpty().withMessage('Student ID is required').isInt().withMessage('Student ID must be an integer'),
        body('major_id').notEmpty().withMessage('Major ID is required').isInt().withMessage('Major ID must be an integer'),
        body('grade_id').notEmpty().withMessage('Grade ID is required').isInt().withMessage('Grade ID must be an integer'),
        body('course_id').notEmpty().withMessage('Course ID is required').isInt().withMessage('Course ID must be an integer'),
        body('schedule_id').notEmpty().withMessage('Schedule ID is required').isInt().withMessage('Schedule ID must be an integer'),
    ],
    /**
     * End:: Validate student record fields
     */

    /**
     * Begin:: Create student record
     */
    async createStudentRecord(req, res) {
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

            const { stu_id, major_id, grade_id, course_id, schedule_id } = req.body;

            const student = await sequelize.models.Student.findByPk(stu_id);
            if (!student) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: `មិនមានសិស្សដែលមាន id = ${stu_id} ទេ`,
                });
            }

            const stu_id_fk = student.id;

            const [result] = await sequelize.query(
                `INSERT INTO "StudentRecords" 
         ("stu_id", "major_id", "grade_id", "course_id", "schedule_id", "createdAt", "updatedAt")
         VALUES (:stu_id, :major_id, :grade_id, :course_id, :schedule_id, NOW(), NOW())
         RETURNING *;`,
                {
                    replacements: {stu_id: stu_id_fk, major_id, grade_id, course_id, schedule_id},
                    type: sequelize.QueryTypes.INSERT
                }
            );

            return res.status(201).json({
                status: 'success',
                error: false,
                message: 'បន្ថែមកំណត់ត្រាសិស្សជោគជ័យ',
                data: result[0],
            });

        } catch (error) {
            console.error('Create student record error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលបន្ថែមកំណត់ត្រាសិស្ស',
                details: error.message,
            });
        }
    },
    /**
     * End:: Create student record
     */

    /**
     * Begin:: Get all student records with paging, search, and filters
     */
    async getAllStudentRecords(req, res) {
        try {
            const {
                page = 1,
                size = 10,
                search = '',
                major_id,
                grade_id,
                course_id,
                schedule_id,
                startDate,
                endDate,
            } = req.query;

            const offset = (page - 1) * size;

            let whereClause = 'WHERE 1=1';
            const replacements = {};

            if (search) {
                whereClause += `
                AND (
                    LOWER(s.first_name) LIKE :search
                    OR LOWER(s.last_name) LIKE :search
                    OR LOWER(m.major_name) LIKE :search
                    OR LOWER(g.grade_name) LIKE :search
                )`;
                replacements.search = `%${search.toLowerCase()}%`;
            }

            if (major_id) {
                whereClause += ' AND sr.major_id = :major_id';
                replacements.major_id = major_id;
            }
            if (grade_id) {
                whereClause += ' AND sr.grade_id = :grade_id';
                replacements.grade_id = grade_id;
            }
            if (course_id) {
                whereClause += ' AND sr.course_id = :course_id';
                replacements.course_id = course_id;
            }
            if (schedule_id) {
                whereClause += ' AND sr.schedule_id = :schedule_id';
                replacements.schedule_id = schedule_id;
            }

            if (startDate && endDate) {
                const start = moment(startDate.trim(), 'DD-MMM-YYYY').startOf('day').toISOString();
                const end = moment(endDate.trim(), 'DD-MMM-YYYY').endOf('day').toISOString();

                whereClause += ' AND sr."createdAt" BETWEEN :start AND :end';
                replacements.start = start;
                replacements.end = end;
            }

            const query = `
            SELECT 
                sr.id AS record_id,
                sr.stu_id,
                sr.major_id,
                sr.grade_id,
                sr.course_id,
                sr.schedule_id,
                sr."createdAt",
                sr."updatedAt",
                s.id AS student_id,
                s.stu_id AS student_stu_id,
                s.first_name,
                s.last_name,
                s.status AS status,
                m.id AS major_id,
                m.major_name,
                g.id AS grade_id,
                g.grade_name,
                c.id AS course_id,
                c.name AS course_name,
                sch.id AS schedule_id,
                sch.schedule_list
            FROM "StudentRecords" sr
            JOIN "Students" s ON sr.stu_id = s.id
            JOIN "Majors" m ON sr.major_id = m.id
            JOIN "Grades" g ON sr.grade_id = g.id
            JOIN "Courses" c ON sr.course_id = c.id
            JOIN "Schedules" sch ON sr.schedule_id = sch.id
            ${whereClause}
            ORDER BY sr."createdAt" DESC
            LIMIT :limit OFFSET :offset;
        `;

            const countQuery = `
            SELECT COUNT(*) AS total
            FROM "StudentRecords" sr
            JOIN "Students" s ON sr.stu_id = s.id
            JOIN "Majors" m ON sr.major_id = m.id
            JOIN "Grades" g ON sr.grade_id = g.id
            JOIN "Courses" c ON sr.course_id = c.id
            JOIN "Schedules" sch ON sr.schedule_id = sch.id
            ${whereClause};
        `;

            const [records] = await Promise.all([
                sequelize.query(query, {
                    replacements: { ...replacements, limit: parseInt(size), offset: parseInt(offset) },
                    type: sequelize.QueryTypes.SELECT,
                }),
                sequelize.query(countQuery, {
                    replacements,
                    type: sequelize.QueryTypes.SELECT,
                }),
            ]);

            const [totalResult] = await sequelize.query(
                `SELECT COUNT(*) AS total FROM "Schedules";`,
                { type: sequelize.QueryTypes.SELECT }
            );
            const total = parseInt(totalResult.total);

            const totalPage = Math.ceil(total / size);

            const formattedRecords = records.map(r => ({
                id: r.record_id,
                stu_id: r.student_id,
                first_name: r.first_name,
                last_name: r.last_name,
                major: r.major_name,
                grade: r.grade_name,
                course: r.course_name,
                schedule: r.schedule_list,
                status: r.status,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt
            }));

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកកំណត់ត្រាសិស្សបានជោគជ័យ',
                data: formattedRecords,
                paging: {
                    size: parseInt(size),
                    page: parseInt(page),
                    totalPage,
                    total
                }
            });

        } catch (error) {
            console.error('Get all student records error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកកំណត់ត្រាសិស្ស',
                details: error.message,
            });
        }
    },
    /**
     * End:: Get all student records with paging, search, and filters
     */

    /**
     * Begin:: Form options for Student Record (only pending students)
     */
    async formStuRecord(req, res) {
        try {
            const [students] = await sequelize.query(
                `SELECT id, first_name, last_name 
             FROM "Students" 
             WHERE status = 'pending'
             ORDER BY "createdAt" DESC;`
            );

            const [majors] = await sequelize.query(
                `SELECT id, major_name FROM "Majors" ORDER BY "major_name" ASC;`
            );

            const [grades] = await sequelize.query(
                `SELECT id, grade_name FROM "Grades" ORDER BY "grade_name" ASC;`
            );

            const [courses] = await sequelize.query(
                `SELECT id, name FROM "Courses" ORDER BY "name" ASC;`
            );

            const [schedules] = await sequelize.query(
                `SELECT id, schedule_list FROM "Schedules" ORDER BY "schedule_list" ASC;`
            );

            const formattedStudents = students.map(s => ({
                label: `${s.first_name} ${s.last_name}`,
                value: s.id,
            }));

            const formattedMajors = majors.map(m => ({
                label: m.major_name,
                value: m.id,
            }));

            const formattedGrades = grades.map(g => ({
                label: g.grade_name,
                value: g.id,
            }));

            const formattedCourses = courses.map(c => ({
                label: c.name,
                value: c.id,
            }));

            const formattedSchedules = schedules.map(sch => ({
                label: sch.schedule_list,
                value: sch.id,
            }));

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកទម្រង់បន្ថែមកំណត់ត្រាសិស្សបានជោគជ័យ',
                data: {
                    students: formattedStudents,
                    majors: formattedMajors,
                    grades: formattedGrades,
                    courses: formattedCourses,
                    schedules: formattedSchedules,
                },
            });

        } catch (error) {
            console.error('Form student record error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកទម្រង់កំណត់ត្រាសិស្ស',
                details: error.message,
            });
        }
    },
    /**
     * End:: Form options for Student Record
     */

    /**
     * Begin:: Get one student record
     */
    async getOneStudentRecord(req, res) {
        try {
            const { id } = req.params;

            const records = await sequelize.query(
                `
            SELECT 
                sr.id AS record_id,
                sr.stu_id,
                sr.major_id,
                sr.grade_id,
                sr.course_id,
                sr.schedule_id,
                s.status,
                sr."createdAt",
                sr."updatedAt",
                s.first_name,
                s.last_name,
                m.major_name,
                g.grade_name,
                c.name AS course_name,
                sch.schedule_list
            FROM "StudentRecords" sr
            JOIN "Students" s ON sr.stu_id = s.id
            JOIN "Majors" m ON sr.major_id = m.id
            JOIN "Grades" g ON sr.grade_id = g.id
            JOIN "Courses" c ON sr.course_id = c.id
            JOIN "Schedules" sch ON sr.schedule_id = sch.id
            WHERE sr.id = :id;
            `,
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            if (!records || records.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានកំណត់ត្រាសិស្សនេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            const r = records[0];

            // Flattened structure
            const formattedRecord = {
                id: r.record_id,
                stu_id: r.stu_id,
                first_name: r.first_name,
                last_name: r.last_name,
                major: r.major_name,
                major_id: r.major_id,
                grade: r.grade_name,
                grade_id: r.grade_id,
                course: r.course_name,
                course_id: r.course_id,
                schedule: r.schedule_list,
                schedule_id: r.schedule_id,
                status: r.status,
                createdAt: r.createdAt,
                updatedAt: r.updatedAt
            };

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'ទាញយកកំណត់ត្រាសិស្សបានជោគជ័យ',
                data: formattedRecord,
            });

        } catch (error) {
            console.error('Get one student record error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលទាញយកកំណត់ត្រាសិស្ស',
                details: error.message,
            });
        }
    },
    /**
     * End:: Get one student record
     */

    /**
     * Begin:: Update student record
     */
    async updateStudentRecord(req, res) {
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

            const {id} = req.params;
            const {stu_id, major_id, grade_id, course_id, schedule_id} = req.body;

            const [recordExist] = await sequelize.query(
                'SELECT * FROM "StudentRecords" WHERE "id" = :id;',
                {replacements: {id}, type: sequelize.QueryTypes.SELECT}
            );

            if (!recordExist) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានកំណត់ត្រាសិស្សនេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            const fieldsToUpdate = {};
            if (stu_id) fieldsToUpdate.stu_id = stu_id;
            if (major_id) fieldsToUpdate.major_id = major_id;
            if (grade_id) fieldsToUpdate.grade_id = grade_id;
            if (course_id) fieldsToUpdate.course_id = course_id;
            if (schedule_id) fieldsToUpdate.schedule_id = schedule_id;

            const setClause = Object.keys(fieldsToUpdate)
                .map(key => `"${key}" = :${key}`)
                .join(', ');

            await sequelize.query(
                `UPDATE "StudentRecords" SET ${setClause}, "updatedAt" = NOW() WHERE "id" = :id;`,
                {replacements: {...fieldsToUpdate, id}}
            );

            const [updatedRecord] = await sequelize.query(
                'SELECT * FROM "StudentRecords" WHERE "id" = :id;',
                {replacements: {id}, type: sequelize.QueryTypes.SELECT}
            );

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'កែប្រែកំណត់ត្រាសិស្សជោគជ័យ',
                data: updatedRecord,
            });

        } catch (error) {
            console.error('Update student record error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលកែប្រែកំណត់ត្រាសិស្ស',
                details: error.message,
            });
        }
    },
    /**
     * End:: Update student record
     */

    /**
     * Begin:: Update student status via StudentRecord (Admin only)
     */
    async updateStudentStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            if (!status || !['pending', 'confirmed'].includes(status)) {
                return res.status(400).json({
                    status: 'error',
                    error: true,
                    message: 'ស្ថានភាពដែលផ្តល់មកមិនត្រឹមត្រូវ (ត្រូវជា "pending" ឬ "confirmed")',
                });
            }

            const record = await sequelize.models.StudentRecord.findByPk(id);
            if (!record) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: `មិនមានកំណត់ត្រាសិស្សដែលមាន id = ${id} ទេ`,
                });
            }

            const student = await sequelize.models.Student.findByPk(record.stu_id);
            if (!student) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: `មិនមានសិស្សដែលមាន id = ${record.stu_id} ទេ`,
                });
            }

            student.status = status;
            await student.save();

            return res.status(200).json({
                status: 'success',
                error: false,
                message: `ធ្វើបច្ចុប្បន្នភាពស្ថានភាពសិស្សជា "${status}" បានជោគជ័យ`,
                data: {
                    student_id: student.id,
                    first_name: student.first_name,
                    last_name: student.last_name,
                    status: student.status,
                    record_id: record.id
                }
            });

        } catch (error) {
            console.error('Update student status error:', error);
            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលធ្វើបច្ចុប្បន្នភាពស្ថានភាពសិស្ស',
                details: error.message,
            });
        }
    },
    /**
     * End:: Update student status
     */


    /**
     * Begin:: Delete student record
     */
    async deleteStudentRecord(req, res) {
        try {
            const { id } = req.params;

            const recordExist = await sequelize.query(
                'SELECT * FROM "StudentRecords" WHERE "id" = :id;',
                { replacements: { id }, type: sequelize.QueryTypes.SELECT }
            );

            if (!recordExist || recordExist.length === 0) {
                return res.status(404).json({
                    status: 'error',
                    error: true,
                    message: 'មិនមានកំណត់ត្រាសិស្សនេះនៅក្នុងប្រព័ន្ធ',
                });
            }

            await sequelize.query(
                'DELETE FROM "StudentRecords" WHERE "id" = :id;',
                { replacements: { id } }
            );

            return res.status(200).json({
                status: 'success',
                error: false,
                message: 'លុបកំណត់ត្រាសិស្សបានជោគជ័យ',
            });

        } catch (error) {
            console.error('Delete student record error:', error);

            if (error.name === 'SequelizeForeignKeyConstraintError') {
                return res.status(400).json({
                    status: 'error',
                    error: true,
                    message: 'មិនអាចលុបកំណត់ត្រា ដោយសារតែមានទំនាក់ទំនងនឹងតារាងផ្សេងទៀត',
                    details: error.message,
                });
            }

            return res.status(500).json({
                status: 'error',
                error: true,
                message: 'មានបញ្ហា ខណៈពេលលុបកំណត់ត្រាសិស្ស',
                details: error.message,
            });
        }
    },
    /**
     * End:: Delete student record
     */

};

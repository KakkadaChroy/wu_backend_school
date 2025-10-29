'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class StudentRecord extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            StudentRecord.belongsTo(models.Student, {
                foreignKey: 'stu_id',
                as: 'student'
            });

            StudentRecord.belongsTo(models.Major, {
                foreignKey: 'major_id',
                as: 'major'
            });

            StudentRecord.belongsTo(models.Grade, {
                foreignKey: 'grade_id',
                as: 'grade'
            });

            StudentRecord.belongsTo(models.Course, {
                foreignKey: 'course_id',
                as: 'course'
            });

            StudentRecord.belongsTo(models.Schedule, {
                foreignKey: 'schedule_id',
                as: 'schedule'
            });
        }
    }

    StudentRecord.init({
        stu_id: DataTypes.INTEGER,
        major_id: DataTypes.INTEGER,
        grade_id: DataTypes.INTEGER,
        course_id: DataTypes.INTEGER,
        schedule_id: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'StudentRecord',
        tableName: 'StudentRecords'
    });
    return StudentRecord;
};
'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Course extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Course.hasMany(models.StudentRecord, {
                foreignKey: 'course_id',
                as: 'records'
            });
        }
    }

    Course.init({
        name: DataTypes.STRING,
        description: DataTypes.TEXT,
        start_date: DataTypes.DATE,
        end_date: DataTypes.DATE,
        duration: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Course',
        tableName: 'Courses',
    });
    return Course;
};
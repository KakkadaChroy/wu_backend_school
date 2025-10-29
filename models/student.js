'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Student extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Student.hasMany(models.StudentRecord, {
                foreignKey: 'stu_id',
                as: 'records'
            });
        }
    }

    Student.init({
        stu_id: DataTypes.INTEGER,
        first_name: DataTypes.STRING,
        last_name: DataTypes.STRING,
        dob: DataTypes.DATE,
        phone: DataTypes.STRING,
        email: DataTypes.STRING,
        gender: DataTypes.STRING,
        age: DataTypes.INTEGER,
        status: DataTypes.STRING
    }, {
        sequelize,
        hooks: {
            beforeCreate: async (student) => {
                const lastStudent = await Student.findOne({
                    order: [['createdAt', 'DESC']],
                });
                let nextId = 1;
                if (lastStudent) {
                    nextId = lastStudent.stu_id + 1;
                }
                student.stu_id = nextId;
            },
        },
        modelName: 'Student',
        tableName: 'Students',
    });
    return Student;
};
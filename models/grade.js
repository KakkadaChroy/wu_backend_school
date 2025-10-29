'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Grade extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Grade.hasMany(models.StudentRecord, {
                foreignKey: 'grade_id',
                as: 'records'
            });
        }
    }

    Grade.init({
        grade_name: DataTypes.STRING,
        description: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'Grade',
        tableName: 'Grades'
    });
    return Grade;
};
'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Schedule extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
            Schedule.hasMany(models.StudentRecord, {
                foreignKey: 'schedule_id',
                as: 'records'
            });
        }
    }

    Schedule.init({
        schedule_list: DataTypes.STRING,
        description: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'Schedule',
        tableName: 'Schedules',
    });
    return Schedule;
};
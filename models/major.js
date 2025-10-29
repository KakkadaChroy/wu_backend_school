'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Major extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Major.hasMany(models.StudentRecord, {
                foreignKey: 'major_id',
                as: 'records'
            });
        }
    }

    Major.init({
        major_name: DataTypes.STRING,
        major_type: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Major',
        tableName: 'Majors',
    });
    return Major;
};
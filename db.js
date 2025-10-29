const { Sequelize } = require('sequelize');
const config = require('./config/config.json');
const pg = require('pg');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize({
    ...dbConfig,
    dialectModule: pg
});

module.exports = { sequelize };

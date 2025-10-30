const express = require('express');
const cors = require('cors');
const {sequelize} = require("./db");
const dotenv = require('dotenv');

const app = express();
dotenv.config();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:3002',
    ],
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

sequelize.authenticate()
    .then(() => console.log(`✅ PostgreSQL connected with Sequelize on server: 'Supabase'`))
    .catch((err) => console.error('❌ PostgreSQL connection failed:', err.message));

/**
 * Begin::Declare routes section
 */
const stuRouter = require('./routes/stu');
const majorRouter = require('./routes/major');
const gradeRouter = require('./routes/grade');
const courseRouter = require('./routes/course');
const scheduleRouter = require('./routes/schedule');
const stuRecordRouter = require('./routes/stu-record');
const dashboardRouter = require('./routes/dashboard');
const userRouter = require('./routes/user');
const authRouter = require('./routes/auth');
/**
 * End::Declare routes section
 */

/**
 * Begin::Using routes section
 */
app.use(`${process.env.BASE_URL}/students`, stuRouter);
app.use(`${process.env.BASE_URL}/majors`, majorRouter);
app.use(`${process.env.BASE_URL}/grades`, gradeRouter);
app.use(`${process.env.BASE_URL}/courses`, courseRouter);
app.use(`${process.env.BASE_URL}/schedules`, scheduleRouter);
app.use(`${process.env.BASE_URL}/student-records`, stuRecordRouter);
app.use(`${process.env.BASE_URL}/dashboard`, dashboardRouter);
app.use(`${process.env.BASE_URL}/users`, userRouter);
app.use(`${process.env.BASE_URL}/auth`, authRouter);
/**
 * End::Using routes section
 */

module.exports = app;
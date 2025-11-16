const express = require('express');
const {dashboardStats} = require("../controllers/dashboard.controller");
const {verifyToken} = require("../middleware/auth.middleware");
const router = express.Router();

router.get('/', verifyToken, dashboardStats);

module.exports = router;
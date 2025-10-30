const express = require('express');
const {dashboardStats} = require("../controllers/dashboard.controller");
const router = express.Router();

router.get('/', dashboardStats);

module.exports = router;
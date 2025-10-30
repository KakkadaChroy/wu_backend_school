const express = require('express');
const {createSchedule, deleteSchedule, getAllSchedules, getOneSchedule, updateSchedule} = require("../controllers/schedule.controller");
const {verifyToken} = require("../middleware/auth.middleware");
const router = express.Router();

router.use(verifyToken);

router.post('/', createSchedule);
router.put('/:id', updateSchedule);

router.get('/', getAllSchedules);
router.get('/:id', getOneSchedule);

router.delete('/:id', deleteSchedule);
module.exports = router;
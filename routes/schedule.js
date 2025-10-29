const express = require('express');
const {createSchedule, deleteSchedule, getAllSchedules, getOneSchedule, updateSchedule} = require("../controllers/schedule.controller");
const router = express.Router();

router.post('/', createSchedule);
router.put('/:id', updateSchedule);

router.get('/', getAllSchedules);
router.get('/:id', getOneSchedule);

router.delete('/:id', deleteSchedule);
module.exports = router;
const express = require('express');
const {createStudentRecord, updateStudentRecord, getAllStudentRecords, getOneStudentRecord, deleteStudentRecord, formStuRecord,
    updateStudentStatus
} = require("../controllers/stu-record.controller");
const router = express.Router();

router.post('/', createStudentRecord);
router.put('/:id', updateStudentRecord);
router.put('/:id/status', updateStudentStatus);

router.get('/', getAllStudentRecords);
router.get('/form', formStuRecord);
router.get('/:id', getOneStudentRecord);

router.delete('/:id', deleteStudentRecord);
module.exports = router;
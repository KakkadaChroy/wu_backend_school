const express = require('express');
const {createStu, updateStu, getAllStu, getOneStu, deleteStu, formStudent, filterStudent} = require("../controllers/stu.controller");
const router = express.Router();

router.post('/', createStu);
router.put('/:id', updateStu);

router.get('/', getAllStu);
router.get('/form', formStudent);
router.get('/filter', filterStudent);
router.get('/:id', getOneStu);

router.delete('/:id', deleteStu);
module.exports = router;
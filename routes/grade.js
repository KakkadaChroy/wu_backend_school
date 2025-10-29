const express = require('express');
const {createGrade, updateGrade, getAllGrades, getOneGrade, deleteGrade} = require("../controllers/grade.controller");
const router = express.Router();

router.post('/', createGrade);
router.put('/:id', updateGrade);

router.get('/', getAllGrades);
router.get('/:id', getOneGrade);

router.delete('/:id', deleteGrade);
module.exports = router;
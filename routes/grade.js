const express = require('express');
const {createGrade, updateGrade, getAllGrades, getOneGrade, deleteGrade} = require("../controllers/grade.controller");
const {verifyToken} = require("../middleware/auth.middleware");
const router = express.Router();

router.use(verifyToken);

router.post('/', createGrade);
router.put('/:id', updateGrade);

router.get('/', getAllGrades);
router.get('/:id', getOneGrade);

router.delete('/:id', deleteGrade);
module.exports = router;
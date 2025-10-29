const express = require('express');
const {createMajor, updateMajor, deleteMajor, getAllMajors, getOneMajor} = require("../controllers/major.controller");
const router = express.Router();

router.post('/', createMajor);
router.put('/:id', updateMajor);

router.get('/', getAllMajors);
router.get('/:id', getOneMajor);

router.delete('/:id', deleteMajor);

module.exports = router;
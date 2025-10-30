const express = require('express');
const {createMajor, updateMajor, deleteMajor, getAllMajors, getOneMajor} = require("../controllers/major.controller");
const {verifyToken} = require("../middleware/auth.middleware");
const router = express.Router();

router.use(verifyToken);

router.post('/', createMajor);
router.put('/:id', updateMajor);

router.get('/', getAllMajors);
router.get('/:id', getOneMajor);

router.delete('/:id', deleteMajor);

module.exports = router;
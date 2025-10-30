const express = require('express');
const {createCourse, updateCourse, deleteCourse, getOneCourse, getAllCourses} = require("../controllers/course.controller");
const {verifyToken} = require("../middleware/auth.middleware");
const router = express.Router();

router.use(verifyToken);

router.post('/', createCourse);
router.put('/:id', updateCourse);

router.get('/', getAllCourses);
router.get('/:id', getOneCourse);

router.delete('/:id', deleteCourse);
module.exports = router;
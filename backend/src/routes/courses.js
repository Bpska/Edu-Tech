const express = require('express');
const prisma = require('../db');
const { verifyToken } = require('./auth');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, description: true, price: true, tests: { select: { id: true } } }
    });
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: { 
        tests: { select: { id: true, title: true, duration: true, totalQuestions: true } },
        resources: true 
      }
    });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

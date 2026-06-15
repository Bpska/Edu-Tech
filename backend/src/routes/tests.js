const express = require('express');
const prisma = require('../db');
const { verifyToken } = require('./auth');

const router = express.Router();

// Get test details (without questions)
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: { course: true }
    });
    if (!test) return res.status(404).json({ error: 'Test not found' });
    
    // Check if user purchased the course
    const purchase = await prisma.purchase.findFirst({
      where: { userId: req.user.userId, courseId: test.courseId, status: 'SUCCESS' }
    });
    
    if (!purchase && test.course.price > 0) {
      return res.status(403).json({ error: 'Purchase required' });
    }
    
    res.json(test);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get test questions (Starts the exam virtually, protected)
router.get('/:id/questions', verifyToken, async (req, res) => {
  try {
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: {
        course: { select: { price: true } }, // Include course so we can check price
        questions: { select: { id: true, text: true, options: true } } // Exclude correct answer
      }
    });
    if (!test) return res.status(404).json({ error: 'Test not found' });
    
    const purchase = await prisma.purchase.findFirst({
      where: { userId: req.user.userId, courseId: test.courseId, status: 'SUCCESS' }
    });
    
    // FIX: was test.price (doesn't exist) — must check test.course.price
    if (!purchase && test.course.price > 0) {
      return res.status(403).json({ error: 'Purchase required' });
    }
    
    res.json(test.questions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

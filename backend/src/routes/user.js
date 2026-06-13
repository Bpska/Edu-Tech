const express = require('express');
const prisma = require('../db');
const { verifyToken } = require('./auth');

const router = express.Router();

router.get('/courses', verifyToken, async (req, res) => {
  try {
    // Return all courses the user has purchased successfully
    const purchases = await prisma.purchase.findMany({
      where: { userId: req.user.userId, status: 'SUCCESS' },
      include: { course: true }
    });
    const courses = purchases.map(p => p.course);
    res.json(courses);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/exam-history', verifyToken, async (req, res) => {
  try {
    const history = await prisma.examHistory.findMany({
      where: { userId: req.user.userId },
      include: { test: true },
      orderBy: { completedAt: 'desc' }
    });
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

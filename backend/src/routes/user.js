const express = require('express');
const prisma = require('../db');
const { verifyToken } = require('./auth');

const router = express.Router();

router.get('/courses', verifyToken, async (req, res) => {
  try {
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

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// FIX: /read-all MUST be registered before /:id/read
// Otherwise Express matches 'read-all' as the :id parameter and calls the wrong handler
router.patch('/notifications/read-all', verifyToken, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/notifications/:id/read', verifyToken, async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── FEEDBACK ────────────────────────────────────────────────────────────────
router.post('/feedback', verifyToken, async (req, res) => {
  try {
    const { rating, message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const feedback = await prisma.feedback.create({
      data: { userId: req.user.userId, rating: parseInt(rating) || 5, message }
    });
    res.json(feedback);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;


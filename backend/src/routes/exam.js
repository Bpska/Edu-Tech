const express = require('express');
const prisma = require('../db');
const { verifyToken } = require('./auth');

const router = express.Router();

router.post('/start', verifyToken, async (req, res) => {
  const { testId } = req.body;
  try {
    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) return res.status(404).json({ error: 'Test not found' });
    
    // In a real app we might record the start time to enforce server-side limits
    res.json({ message: 'Exam started', testId });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/submit', verifyToken, async (req, res) => {
  const { testId, responses } = req.body; // responses: Record<questionId, selectedOptionIndex>
  try {
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: { questions: true }
    });
    
    if (!test) return res.status(404).json({ error: 'Test not found' });

    let score = 0;
    const questions = test.questions;
    
    questions.forEach((q) => {
      if (responses[q.id] !== undefined && responses[q.id] === q.correctAnswerIndex) {
        score++;
      }
    });

    const history = await prisma.examHistory.create({
      data: {
        userId: req.user.userId,
        testId: testId,
        score: score,
        responses: JSON.stringify(responses)
      }
    });

    res.json({ message: 'Exam submitted successfully', score, total: questions.length, historyId: history.id });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

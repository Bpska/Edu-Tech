const express = require('express');
const prisma = require('../db');

const router = express.Router();

// ─── STATS ────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [userCount, courseCount, testCount, purchaseCount, examCount] = await Promise.all([
      prisma.user.count(),
      prisma.course.count(),
      prisma.test.count(),
      prisma.purchase.count({ where: { status: 'SUCCESS' } }),
      prisma.examHistory.count(),
    ]);

    const revenue = await prisma.purchase.findMany({
      where: { status: 'SUCCESS' },
      include: { course: { select: { price: true } } }
    });
    const totalRevenue = revenue.reduce((acc, p) => acc + (p.course?.price || 0), 0);

    res.json({ userCount, courseCount, testCount, purchaseCount, examCount, totalRevenue });
  } catch (e) {
    console.error('[Admin Stats Error]', e);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// ─── USERS ────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, email: true, name: true, role: true, createdAt: true,
        _count: { select: { purchases: true, examHistories: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  } catch (e) {
    console.error('[Admin Users Error]', e);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.examHistory.deleteMany({ where: { userId: req.params.id } });
    await prisma.purchase.deleteMany({ where: { userId: req.params.id } });
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ─── COURSES ──────────────────────────────────────────────────────────────────
router.get('/courses', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: { select: { tests: true, purchases: true, resources: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(courses);
  } catch (e) {
    console.error('[Admin Courses Error]', e);
    res.status(500).json({ error: 'Failed to load courses' });
  }
});

router.post('/courses', async (req, res) => {
  try {
    const { title, description, price, isPublished } = req.body;
    const parsedPrice = price ? parseFloat(price) : 0;
    const course = await prisma.course.create({
      data: { title, description, price: parsedPrice, isPublished: isPublished ?? false }
    });
    res.json(course);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

router.put('/courses/:id', async (req, res) => {
  try {
    const { title, description, price, isPublished } = req.body;
    const parsedPrice = price ? parseFloat(price) : 0;
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data: { title, description, price: parsedPrice, isPublished }
    });
    res.json(course);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

router.delete('/courses/:id', async (req, res) => {
  try {
    // Delete nested data first
    const tests = await prisma.test.findMany({ where: { courseId: req.params.id } });
    for (const test of tests) {
      await prisma.examHistory.deleteMany({ where: { testId: test.id } });
      await prisma.question.deleteMany({ where: { testId: test.id } });
    }
    await prisma.test.deleteMany({ where: { courseId: req.params.id } });
    await prisma.purchase.deleteMany({ where: { courseId: req.params.id } });
    await prisma.resource.deleteMany({ where: { courseId: req.params.id } });
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ message: 'Course deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

// ─── RESOURCES ────────────────────────────────────────────────────────────────
router.get('/courses/:courseId/resources', async (req, res) => {
  try {
    const resources = await prisma.resource.findMany({ where: { courseId: req.params.courseId } });
    res.json(resources);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load resources' });
  }
});

router.post('/resources', async (req, res) => {
  try {
    const { courseId, title, type, url, content } = req.body;
    const resource = await prisma.resource.create({
      data: { courseId, title, type, url, content }
    });
    res.json(resource);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

router.put('/resources/:id', async (req, res) => {
  try {
    const { title, type, url, content } = req.body;
    const resource = await prisma.resource.update({
      where: { id: req.params.id },
      data: { title, type, url, content }
    });
    res.json(resource);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

router.delete('/resources/:id', async (req, res) => {
  try {
    await prisma.resource.delete({ where: { id: req.params.id } });
    res.json({ message: 'Resource deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

// ─── TESTS ────────────────────────────────────────────────────────────────────
router.get('/tests', async (req, res) => {
  try {
    const tests = await prisma.test.findMany({
      include: {
        course: { select: { title: true } },
        _count: { select: { questions: true, examHistories: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tests);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load tests' });
  }
});

router.post('/tests', async (req, res) => {
  try {
    const { courseId, title, duration } = req.body;
    const parsedDuration = duration ? parseInt(duration) : 0;
    const test = await prisma.test.create({
      data: { courseId, title, duration: parsedDuration, totalQuestions: 0 }
    });
    res.json(test);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create test' });
  }
});

router.put('/tests/:id', async (req, res) => {
  try {
    const { title, duration } = req.body;
    const parsedDuration = duration ? parseInt(duration) : 0;
    const test = await prisma.test.update({
      where: { id: req.params.id },
      data: { title, duration: parsedDuration }
    });
    res.json(test);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update test' });
  }
});

router.delete('/tests/:id', async (req, res) => {
  try {
    await prisma.examHistory.deleteMany({ where: { testId: req.params.id } });
    await prisma.question.deleteMany({ where: { testId: req.params.id } });
    await prisma.test.delete({ where: { id: req.params.id } });
    res.json({ message: 'Test deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete test' });
  }
});

// ─── QUESTIONS ────────────────────────────────────────────────────────────────
router.get('/tests/:testId/questions', async (req, res) => {
  try {
    const questions = await prisma.question.findMany({ where: { testId: req.params.testId } });
    res.json(questions);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load questions' });
  }
});

router.post('/questions', async (req, res) => {
  try {
    const { testId, text, options, correctAnswerIndex } = req.body;
    const question = await prisma.question.create({
      data: { testId, text, options: JSON.stringify(options), correctAnswerIndex: parseInt(correctAnswerIndex) }
    });
    // Update totalQuestions count
    await prisma.test.update({
      where: { id: testId },
      data: { totalQuestions: { increment: 1 } }
    });
    res.json(question);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

router.put('/questions/:id', async (req, res) => {
  try {
    const { text, options, correctAnswerIndex } = req.body;
    const question = await prisma.question.update({
      where: { id: req.params.id },
      data: { text, options: JSON.stringify(options), correctAnswerIndex: parseInt(correctAnswerIndex) }
    });
    res.json(question);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update question' });
  }
});

router.delete('/questions/:id', async (req, res) => {
  try {
    const question = await prisma.question.findUnique({ where: { id: req.params.id } });
    await prisma.question.delete({ where: { id: req.params.id } });
    await prisma.test.update({
      where: { id: question.testId },
      data: { totalQuestions: { decrement: 1 } }
    });
    res.json({ message: 'Question deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete question' });
  }
});

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
router.get('/payments', async (req, res) => {
  try {
    const payments = await prisma.purchase.findMany({
      include: {
        user: { select: { email: true, name: true } },
        course: { select: { title: true, price: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(payments);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load payments' });
  }
});

// ─── EXAM HISTORY ─────────────────────────────────────────────────────────────
router.get('/exam-history', async (req, res) => {
  try {
    const history = await prisma.examHistory.findMany({
      include: {
        user: { select: { email: true, name: true } },
        test: { select: { title: true, totalQuestions: true } }
      },
      orderBy: { completedAt: 'desc' },
      take: 100
    });
    res.json(history);
  } catch (e) {
    res.status(500).json({ error: 'Failed to load exam history' });
  }
});

module.exports = router;

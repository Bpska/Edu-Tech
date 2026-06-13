const express = require('express');
const { z } = require('zod');
const prisma = require('../db');
const { verifyToken } = require('./auth');

const router = express.Router();

const onboardingSchema = z.object({
  dateOfBirth: z.string().optional(),
  classYear: z.string().optional(),
  targetExam: z.string().optional(),
  examAttemptYear: z.string().optional(),
  preferredLanguage: z.string().optional(),
  currentSkillLevel: z.string().optional(),
  dailyStudyHours: z.string().optional(),
  weakSubjects: z.string().optional(),
  strongSubjects: z.string().optional(),
  targetScoreRank: z.string().optional()
});

router.post('/onboarding', verifyToken, async (req, res) => {
  try {
    const data = onboardingSchema.parse(req.body);

    const profile = await prisma.profile.upsert({
      where: { userId: req.user.userId },
      update: {
        ...data
      },
      create: {
        userId: req.user.userId,
        ...data
      }
    });

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { onboardingCompleted: true }
    });

    res.json({ message: 'Onboarding completed', profile });
  } catch (error) {
    console.error('Onboarding error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

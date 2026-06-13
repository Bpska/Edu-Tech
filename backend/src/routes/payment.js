const express = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { verifyToken } = require('./auth');

const router = express.Router();

// Mock Razorpay order creation
router.post('/create-order', verifyToken, async (req, res) => {
  const { courseId } = req.body;
  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    
    const amount = course.price * 100; // In paise
    const currency = 'INR';
    
    // Mocking Razorpay order response
    const mockOrderId = 'order_' + crypto.randomBytes(8).toString('hex');
    
    // Create pending purchase
    await prisma.purchase.create({
      data: {
        userId: req.user.userId,
        courseId: course.id,
        razorpayOrderId: mockOrderId,
        status: 'PENDING'
      }
    });

    res.json({
      id: mockOrderId,
      amount,
      currency
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Webhook / Callback for successful payment
router.post('/webhook', async (req, res) => {
  // In a real app, verify razorpay signature here
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { razorpayOrderId: razorpay_order_id }
    });
    
    if (purchase) {
      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { status: 'SUCCESS' }
      });
    }
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

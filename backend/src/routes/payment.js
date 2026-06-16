const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const prisma = require('../db');
const { verifyToken } = require('./auth');

const router = express.Router();

// Initialize Razorpay SDK (trim secrets to resolve leading/trailing spaces)
const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret
});

// Create Razorpay order
router.post('/create-order', verifyToken, async (req, res) => {
  const { courseId } = req.body;
  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    
    const amount = course.price * 100; // In paise
    const currency = 'INR';

    if (!keyId || !keySecret) {
      return res.status(400).json({ error: 'Razorpay keys not configured on server' });
    }
    
    // Create actual Razorpay order
    const options = {
      amount,
      currency,
      receipt: `receipt_${course.id.slice(0, 10)}_${req.user.userId.slice(0, 10)}_${Date.now().toString().slice(-6)}`
    };
    
    const order = await razorpay.orders.create(options);
    
    // Create pending purchase in database
    await prisma.purchase.create({
      data: {
        userId: req.user.userId,
        courseId: course.id,
        razorpayOrderId: order.id,
        status: 'PENDING'
      }
    });

    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: keyId
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ error: 'Internal server error during order creation' });
  }
});

// Signature verification endpoint
router.post('/verify', verifyToken, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment signature verification parameters' });
  }

  const sign = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac("sha256", keySecret)
    .update(sign.toString())
    .digest("hex");

  if (razorpay_signature === expectedSign) {
    try {
      const purchase = await prisma.purchase.findUnique({
        where: { razorpayOrderId: razorpay_order_id }
      });

      if (!purchase) {
        return res.status(404).json({ error: 'Purchase record not found' });
      }

      await prisma.purchase.update({
        where: { id: purchase.id },
        data: { status: 'SUCCESS' }
      });

      res.json({ status: 'ok', message: 'Payment verified successfully' });
    } catch (error) {
      console.error('Database update error on verification:', error);
      res.status(500).json({ error: 'Internal server error verifying payment' });
    }
  } else {
    res.status(400).json({ error: 'Invalid payment signature' });
  }
});

// Webhook / Callback for successful payment
router.post('/webhook', async (req, res) => {
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


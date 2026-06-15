const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const prisma = require('../db');
const { z } = require('zod');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, 'postmessage');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password_hash, name }
    });
    res.json({ message: 'Registration successful', userId: user.id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    // Guard: Google OAuth users have no password_hash — don't crash bcrypt.compare
    if (!user.password_hash) return res.status(400).json({ error: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', { expiresIn: '7d' });

    // Assuming we use httpOnly cookie for refresh token as best practice, but for simplicity we return both here.
    // In a real app we'd res.cookie('refresh_token', refreshToken, { httpOnly: true })
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });
    res.json({ accessToken, user: { id: user.id, email: user.email, name: user.name, role: user.role, onboardingCompleted: user.onboardingCompleted } });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Authorization code is required' });

    const { tokens } = await client.getToken(code);
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name || '';

    if (!email) return res.status(400).json({ error: 'Google authentication failed' });

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Create user if they don't exist
      user = await prisma.user.create({
        data: { 
          email, 
          name,
        }
      });
    }

    const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET || 'refresh_secret', { expiresIn: '7d' });

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('refresh_token', refreshToken, { httpOnly: true, secure: isProduction, sameSite: isProduction ? 'none' : 'lax' });
    res.json({ accessToken, user: { id: user.id, email: user.email, name: user.name, role: user.role, onboardingCompleted: user.onboardingCompleted } });
  } catch (error) {
    console.error('Google auth error details:', {
      message: error.message,
      code: error.code,
      status: error.status,
      GOOGLE_CLIENT_ID_set: !!GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET_set: !!GOOGLE_CLIENT_SECRET,
    });
    res.status(500).json({ error: 'Google authentication failed: ' + (error.message || 'unknown error') });
  }
});

router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) return res.status(401).json({ error: 'Refresh token not found' });
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) return res.status(401).json({ error: 'User not found' });
    const accessToken = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
    res.json({ accessToken });
  } catch (e) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('refresh_token');
  res.json({ message: 'Logged out' });
});

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role, onboardingCompleted: user.onboardingCompleted });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = { router, verifyToken };

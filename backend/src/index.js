require('dotenv').config();
const express = require('express');
const cors = require('cors');

const cookieParser = require('cookie-parser');

const app = express();

const { router: authRoutes } = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const testRoutes = require('./routes/tests');
const examRoutes = require('./routes/exam');
const paymentRoutes = require('./routes/payment');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const profileRoutes = require('./routes/profile');

app.use(cors({
  origin: (origin, callback) => {
    const allowed = [
      process.env.CLIENT_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:6001',
      `http://${process.env.VPS_IP || '72.61.169.195'}:6001`,
    ].filter(Boolean);
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));


app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/courses', courseRoutes);
app.use('/tests', testRoutes);
app.use('/exam', examRoutes);
app.use('/payment', paymentRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/profile', profileRoutes);

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

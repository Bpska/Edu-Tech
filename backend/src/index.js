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
    const clientUrl = (process.env.CLIENT_URL || '').replace(/\/$/, '');
    const allowed = [
      clientUrl,
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:6001',
      `http://${process.env.VPS_IP || '72.61.169.195'}:6001`,
      'http://logisaar.cloud',
      'https://logisaar.cloud',
      'http://www.logisaar.cloud',
      'https://www.logisaar.cloud',
    ].filter(Boolean);
    
    if (!origin || allowed.includes(origin)) {
      return callback(null, true);
    }
    
    console.error('CORS rejected origin:', origin);
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

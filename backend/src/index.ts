import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import assetRoutes from './routes/assets';
import userRoutes from './routes/users';
import categoryRoutes from './routes/categories';

dotenv.config();

const app = express();

// Trust proxy (needed for rate limiting behind Render/Vercel reverse proxy)
app.set('trust proxy', 1);

// CORS: Allow frontend origin in production or all origins in dev
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL, 'http://localhost:5173'] 
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Global Rate Limiter: Max 200 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Strict API Limiter for Write Operations (POST, PUT, DELETE): Max 100 per 15 minutes
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many write operations. Action blocked.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET', // Only limit mutating requests
});

// Routes
app.use('/api/auth', authRoutes);
// Apply strict limiter specifically to modifying endpoints if needed, but for portfolio protection we can apply it to all asset/user writes
app.use('/api/assets', strictLimiter, assetRoutes);
app.use('/api/users', strictLimiter, userRoutes);
app.use('/api/categories', strictLimiter, categoryRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

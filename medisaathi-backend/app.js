import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import authRoutes  from './src/routes/authRoutes.js';
import hospitalRoutes   from './src/routes/hospitalRoutes.js';
import branchRoutes     from './src/routes/branchRoutes.js';
import tokenRoutes      from './src/routes/tokenRoutes.js';
import staffRoutes      from './src/routes/staffRoutes.js';
import adminRoutes      from './src/routes/adminRoutes.js';
import superAdminRoutes from './src/routes/superadminRoutes.js';

import { errorHandler } from './src/middleware/errorMiddleware.js';

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
const CLIENT_URL = process.env.CLIENT_URL || 'https://medisaathi-flax.vercel.app/';
console.log('Allowed CORS origin:', CLIENT_URL);
app.use(cors({
  origin:      CLIENT_URL,
  credentials: true, // needed so browser sends the httpOnly refresh cookie
}));

// ── Parsing ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));       // body size cap
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ── Logging ───────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/hospitals',  hospitalRoutes);
app.use('/api/branches',   branchRoutes);
app.use('/api/tokens',     tokenRoutes);
app.use('/api/staff',      staffRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/superadmin', superAdminRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler (must be last) ───────────────────────────────────────
app.use(errorHandler);

export default app;

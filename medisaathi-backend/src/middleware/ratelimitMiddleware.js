import rateLimit from 'express-rate-limit';

/**
 * Strict limiter for auth routes — prevent brute force.
 * 10 requests per 15 minutes per IP on login/register.
 */
export const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              10,
  message: {
    success: false,
    message: 'Too many attempts. Please try again after 15 minutes.',
  },
  standardHeaders:  true,
  legacyHeaders:    false,
});

/**
 * General API limiter — prevent abuse on public routes.
 * 100 requests per 10 minutes per IP.
 */
export const apiLimiter = rateLimit({
  windowMs:        10 * 60 * 1000, // 10 minutes
  max:             100,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders:   false,
});
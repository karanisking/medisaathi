import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { authLimiter }  from '../middleware/ratelimitMiddleware.js';
import {
  validateRegister,
  validateLogin,
  validate,
} from '../middleware/validateMiddleware.js';

const router = Router();

router.post('/register', authLimiter, validateRegister, validate, register);
router.post('/login',    authLimiter, validateLogin,    validate, login);
router.post('/logout',   authenticate, logout);
router.get('/me',        authenticate, getMe);

export default router;
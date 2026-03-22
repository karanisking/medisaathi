import { Router } from 'express';
import {
  getAllHospitals,
  getHospitalById,
} from '../controllers/hospitalController.js';
import {
  validateHospitalQuery,
  validateMongoId,
  validate,
} from '../middleware/validateMiddleware.js';
import { apiLimiter } from '../middleware/ratelimitMiddleware.js';

const router = Router();

// Public routes — no auth needed
router.get('/',    apiLimiter, validateHospitalQuery, validate, getAllHospitals);
router.get('/:id', apiLimiter, validateMongoId('id'), validate, getHospitalById);

export default router;
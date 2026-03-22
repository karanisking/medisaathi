import { Router } from 'express';
import {
  getBranchById,
  getBranchQueueStatus,
} from '../controllers/branchController.js';
import { validateMongoId, validate } from '../middleware/validateMiddleware.js';
import { apiLimiter } from '../middleware/ratelimitMiddleware.js';

const router = Router();

// Public routes
router.get('/:id',              apiLimiter, validateMongoId('id'), validate, getBranchById);
router.get('/:id/queue-status', apiLimiter, validateMongoId('id'), validate, getBranchQueueStatus);

export default router;
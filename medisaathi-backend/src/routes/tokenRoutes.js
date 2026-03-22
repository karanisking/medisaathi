import { Router } from 'express';
import {
  joinQueue,
  getMyToken,
  getMyHistory,
  leaveQueue,
} from '../controllers/tokenController.js';
import { authenticate }  from '../middleware/authMiddleware.js';
import { requireRole }   from '../middleware/roleMiddleware.js';
import { ROLES }         from '../models/user.js';
import {
  validateJoinQueue,
  validateMongoId,
  validate,
} from '../middleware/validateMiddleware.js';

const router = Router();

// All token routes require patient login
router.post('/',          authenticate, requireRole(ROLES.PATIENT), validateJoinQueue, validate, joinQueue);
router.get('/mine',       authenticate, requireRole(ROLES.PATIENT), getMyToken);
router.get('/history',       authenticate, requireRole(ROLES.PATIENT), getMyHistory);
router.delete('/:id/leave', authenticate, requireRole(ROLES.PATIENT), validateMongoId('id'), validate, leaveQueue);

export default router;
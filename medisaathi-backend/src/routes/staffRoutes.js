import { Router } from 'express';
import {
  getLiveQueue,
  callNextToken,
  skipToken,
  completeToken,
  pauseQueue,
  resumeQueue,
} from '../controllers/StaffController.js';
import { authenticate }      from '../middleware/authMiddleware.js';
import { requireRole, requireSameBranch } from '../middleware/roleMiddleware.js';
import { validateMongoId, validate } from '../middleware/validateMiddleware.js';
import { ROLES } from '../models/User.js';

const router = Router();

// All staff routes: must be authenticated + role staff
router.use(authenticate, requireRole(ROLES.STAFF));

router.get('/queue',                                              getLiveQueue);
router.post('/queue/next',                                        callNextToken);
router.post('/tokens/:id/skip',     validateMongoId('id'), validate, skipToken);
router.post('/tokens/:id/complete', validateMongoId('id'), validate, completeToken);
router.post('/queue/pause',                                       pauseQueue);
router.post('/queue/resume',                                      resumeQueue);

export default router;
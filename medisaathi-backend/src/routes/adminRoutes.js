import { Router } from 'express';
import {
  getBranches,
  createBranch,
  updateBranch,
  toggleQueue,
  createStaff,
  removeStaff,
  getStaff,
  getAnalytics,
} from '../controllers/adminController.js';
import { authenticate }      from '../middleware/authMiddleware.js';
import { requireRole, requireSameBranch } from '../middleware/roleMiddleware.js';
import { ROLES } from '../models/user.js';
import {
  validateCreateBranch,
  validateUpdateBranch,
  validateCreateStaff,
  validateMongoId,
  validate,
} from '../middleware/validateMiddleware.js';

const router = Router();

router.use(authenticate, requireRole(ROLES.OVERALL_ADMIN, ROLES.BRANCH_ADMIN));

// Branches
router.get('/branches',        getBranches);
router.post('/branches',       requireRole(ROLES.OVERALL_ADMIN), validateCreateBranch, validate, createBranch);
router.patch('/branches/:id',  validateMongoId('id'), validate, validateUpdateBranch, validate, updateBranch);
router.patch('/branches/:id/toggle-queue', validateMongoId('id'), validate, toggleQueue);

// Staff management
router.get('/staff',           getStaff);
router.post('/staff',          validateCreateStaff, validate, createStaff);
router.delete('/staff/:id',    validateMongoId('id'), validate, removeStaff);

// Analytics
router.get('/analytics',       getAnalytics);

export default router;
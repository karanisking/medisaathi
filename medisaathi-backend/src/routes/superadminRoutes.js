import { Router } from 'express';
import {
  createHospital,
  updateHospital,
  getAllHospitalsAdmin,
  createHospitalAdmin,
  getPlatformAnalytics,
  getHospitalAdmins,
  updateHospitalAdmin,
  deleteHospitalAdmin,
} from '../controllers/superadminController.js';
import { authenticate }   from '../middleware/authMiddleware.js';
import { requireRole }    from '../middleware/roleMiddleware.js';
import { ROLES }          from '../models/User.js';
import {
  validateCreateHospital,
  validateUpdateHospital,
  validateCreateAdmin,
  validateMongoId,
  validate,
} from '../middleware/validateMiddleware.js';

const router = Router();

router.use(authenticate, requireRole(ROLES.SUPER_ADMIN));

router.get('/hospitals',                           getAllHospitalsAdmin);
router.post('/hospitals',                          validateCreateHospital, validate, createHospital);
router.patch('/hospitals/:id',                     validateUpdateHospital, validate, updateHospital);

// Admins
router.post('/admins',                             validateCreateAdmin, validate, createHospitalAdmin);
router.get('/hospitals/:hospitalId/admins',        getHospitalAdmins);
router.patch('/admins/:id',                        validateMongoId('id'), validate, updateHospitalAdmin);
router.delete('/admins/:id',                       validateMongoId('id'), validate, deleteHospitalAdmin);

// Analytics
router.get('/analytics',                           getPlatformAnalytics);

export default router;
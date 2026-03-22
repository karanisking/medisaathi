import { sendError } from '../utils/responseUtil.js';
import { ROLES } from '../models/User.js';
import { Branch } from '../models/Branch.js';

/**
 * requireRole(...roles)
 * Basic role gate — use after authenticate.
 *
 * router.post('/hospitals', authenticate, requireRole(ROLES.SUPER_ADMIN), handler)
 */
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, { statusCode: 401, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return sendError(res, {
        statusCode: 403,
        message: `Access denied. Allowed roles: ${roles.join(', ')}`,
      });
    }
    next();
  };
};

/**
 * requireSameHospital
 *
 * Ensures overall_admin and branch_admin only access their own hospital.
 * Super admin bypasses — they access everything.
 *
 * Reads hospitalId from: req.params → req.body → req.query (in that order)
 */
export const requireSameHospital = (req, res, next) => {
  const { user } = req;

  if (user.role === ROLES.SUPER_ADMIN) return next();

  const hospitalId =
    req.params.hospitalId ||
    req.body.hospitalId   ||
    req.query.hospitalId;

  if (!hospitalId) {
    return sendError(res, { statusCode: 400, message: 'Hospital ID is required' });
  }

  if (user.hospital?.toString() !== hospitalId.toString()) {
    return sendError(res, {
      statusCode: 403,
      message: 'Access denied — resource belongs to a different hospital',
    });
  }

  next();
};

/**
 * requireSameBranch
 *
 * Ensures branch_admin and staff only access their own assigned branch.
 *
 * Key fix: for branch_admin, we ALSO verify the branch belongs to
 * the same hospital as the admin. This prevents a branch_admin from
 * one hospital sneaking into a branch of another hospital.
 *
 * Logic by role:
 *   super_admin    → pass (access everything)
 *   overall_admin  → pass only if branch belongs to their hospital
 *   branch_admin   → pass only if branch === their branch AND
 *                    branch's hospital === their hospital
 *   staff          → same as branch_admin
 */
export const requireSameBranch = async (req, res, next) => {
  try {
    const { user } = req;

    // Super admin — unrestricted
    if (user.role === ROLES.SUPER_ADMIN) return next();

    const branchId =
      req.params.branchId ||
      req.body.branchId   ||
      req.query.branchId;

    if (!branchId) {
      return sendError(res, { statusCode: 400, message: 'Branch ID is required' });
    }

    // Fetch the branch so we can verify its hospital
    const branch = await Branch.findById(branchId).select('hospital isActive');

    if (!branch) {
      return sendError(res, { statusCode: 404, message: 'Branch not found' });
    }

    // ── Overall admin ─────────────────────────────────────────────────────
    // They can access any branch — but only within their own hospital
    if (user.role === ROLES.OVERALL_ADMIN) {
      if (branch.hospital.toString() !== user.hospital.toString()) {
        return sendError(res, {
          statusCode: 403,
          message: 'Access denied — branch belongs to a different hospital',
        });
      }
      // Attach branch to req so controllers don't fetch it again
      req.branch = branch;
      return next();
    }

    // ── Branch admin & staff ──────────────────────────────────────────────
    // Must match on BOTH branch AND hospital
    const branchMatch   = user.branch?.toString()   === branchId.toString();
    const hospitalMatch = user.hospital?.toString() === branch.hospital.toString();

    if (!branchMatch || !hospitalMatch) {
      return sendError(res, {
        statusCode: 403,
        message: 'Access denied — you are not assigned to this branch',
      });
    }

    req.branch = branch;
    next();

  } catch (err) {
    next(err);
  }
};
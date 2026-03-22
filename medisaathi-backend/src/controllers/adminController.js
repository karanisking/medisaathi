import { Branch }         from '../models/branch.js';
import { User, ROLES }    from '../models/user.js';
import { AnalyticsDaily } from '../models/analyticsdaily.js';
import { QueueState }     from '../models/queueState.js';
import { sendSuccess, sendError } from '../utils/responseUtil.js';
import { getTodayIST }    from '../utils/dateUtil.js';

// ── GET /api/admin/branches ───────────────────────────────────────────────────
export const getBranches = async (req, res, next) => {
  try {
    const { user } = req;

    const filter = {
      hospital: user.hospital,
      isActive: true,
    };

    if (user.role === ROLES.BRANCH_ADMIN || user.role === ROLES.STAFF) {
      filter._id = user.branch;
    }

    const branches = await Branch
      .find(filter)
      .populate('hospital', 'name city state contactPhone contactEmail website description images')
      .select('-createdBy -__v')
      .sort({ name: 1 });

    return sendSuccess(res, { data: { branches } });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/admin/branches (overall admin only) ─────────────────────────────
export const createBranch = async (req, res, next) => {
  try {
    const {
      name, city, state, address,
      contactPhone, contactEmail,
      openTime, closeTime,
      skipTimeoutSec, problemCategories,
    } = req.body;

    const branch = await Branch.create({
      hospital: req.user.hospital,
      name, city, state,
      address:        address     ?? '',
      contactPhone:   contactPhone ?? '',
      contactEmail:   contactEmail ?? '',
      openTime:       openTime     ?? '09:00',
      closeTime:      closeTime    ?? '17:00',
      skipTimeoutSec: skipTimeoutSec ?? 25,
      problemCategories: problemCategories ?? ['eye', 'ent', 'general', 'ortho', 'dental', 'other'],
      createdBy: req.user._id,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Branch created',
      data: { branch },
    });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/admin/branches/:id ─────────────────────────────────────────────
export const updateBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findOne({
      _id:      req.params.id,
      hospital: req.user.hospital,
      isActive: true,
    });

    if (!branch) {
      return sendError(res, { statusCode: 404, message: 'Branch not found' });
    }

    // Branch admin can only update their own branch
    if (
      req.user.role === ROLES.BRANCH_ADMIN &&
      branch._id.toString() !== req.user.branch.toString()
    ) {
      return sendError(res, { statusCode: 403, message: 'You can only update your own branch' });
    }

    const allowed = [
      'name','city','state','address',
      'contactPhone','contactEmail',
      'openTime','closeTime',
      'skipTimeoutSec','problemCategories',
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) branch[field] = req.body[field];
    });

    await branch.save();

    return sendSuccess(res, { message: 'Branch updated', data: { branch } });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/admin/branches/:id/toggle-queue ────────────────────────────────
export const toggleQueue = async (req, res, next) => {
  try {
    const branch = await Branch.findOne({
      _id:      req.params.id,
      hospital: req.user.hospital,
    });

    if (!branch) {
      return sendError(res, { statusCode: 404, message: 'Branch not found' });
    }

    branch.queueEnabled = !branch.queueEnabled;
    await branch.save();

    return sendSuccess(res, {
      message: `Queue ${branch.queueEnabled ? 'enabled' : 'disabled'}`,
      data: { queueEnabled: branch.queueEnabled },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/staff ──────────────────────────────────────────────────────
export const getStaff = async (req, res, next) => {
  try {
    const { user } = req;

    const filter = { hospital: user.hospital, role: ROLES.STAFF, isActive: true };

    // Branch admin only sees staff of their branch
    if (user.role === ROLES.BRANCH_ADMIN) {
      filter.branch = user.branch;
    }

    const staff = await User
      .find(filter)
      .select('name email branch isActive createdAt')
      .populate('branch', 'name city')
      .sort({ name: 1 });

    return sendSuccess(res, { data: { staff } });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/admin/staff ─────────────────────────────────────────────────────
export const createStaff = async (req, res, next) => {
  try {
    const { name, email, password, branchId } = req.body;
    const { user } = req;

    // Verify branch belongs to this hospital
    const branch = await Branch.findOne({
      _id:      branchId,
      hospital: user.hospital,
      isActive: true,
    });

    if (!branch) {
      return sendError(res, { statusCode: 404, message: 'Branch not found in your hospital' });
    }

    // Branch admin can only add staff to their own branch
    if (
      user.role === ROLES.BRANCH_ADMIN &&
      branchId.toString() !== user.branch.toString()
    ) {
      return sendError(res, {
        statusCode: 403,
        message: 'You can only add staff to your own branch',
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, { statusCode: 409, message: 'Email already registered' });
    }

    const staff = await User.create({
      name,
      email,
      password,
      role:      ROLES.STAFF,
      hospital:  user.hospital,
      branch:    branchId,
      createdBy: user._id,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Staff created',
      data: {
        staff: {
          id:     staff._id,
          name:   staff.name,
          email:  staff.email,
          branch: branchId,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/admin/staff/:id ───────────────────────────────────────────────
export const removeStaff = async (req, res, next) => {
  try {
    const { user } = req;

    const staff = await User.findOne({
      _id:      req.params.id,
      role:     ROLES.STAFF,
      hospital: user.hospital,
    });

    if (!staff) {
      return sendError(res, { statusCode: 404, message: 'Staff not found' });
    }

    // Branch admin can only remove staff from their branch
    if (
      user.role === ROLES.BRANCH_ADMIN &&
      staff.branch.toString() !== user.branch.toString()
    ) {
      return sendError(res, { statusCode: 403, message: 'You can only remove staff from your own branch' });
    }

    // Soft delete — keeps records intact for analytics
    staff.isActive = false;
    await staff.save();

    return sendSuccess(res, { message: 'Staff removed' });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/analytics ──────────────────────────────────────────────────
export const getAnalytics = async (req, res, next) => {
  try {
    const { user } = req;
    const today = getTodayIST();

    const { from = today, to = today } = req.query;

    const filter = {
      hospital: user.hospital,
      date:     { $gte: from, $lte: to },
    };

    if (user.role === ROLES.BRANCH_ADMIN) {
      filter.branch = user.branch;
    }

    const analytics = await AnalyticsDaily
      .find(filter)
      .populate('branch', 'name city')
      .sort({ date: -1, 'branch.name': 1 });

    // Live today stats from QueueState
    const stateFilter = { hospital: user.hospital };
    if (user.role === ROLES.BRANCH_ADMIN) stateFilter.branch = user.branch;

    const liveStates = await QueueState.find(stateFilter)
      .populate('branch', 'name');

    return sendSuccess(res, {
      data: { analytics, liveStates },
    });
  } catch (err) {
    next(err);
  }
};
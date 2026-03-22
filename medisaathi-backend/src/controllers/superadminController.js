import { Hospital }       from '../models/hospital.js';
import { Branch }         from '../models/branch.js';
import { User, ROLES }    from '../models/user.js';
import { AnalyticsDaily } from '../models/analyticsdaily.js';
import { sendSuccess, sendError } from '../utils/responseUtil.js';
import { getTodayIST }    from '../utils/dateUtil.js';

// ── GET /api/superadmin/hospitals ─────────────────────────────────────────────
export const getAllHospitalsAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, city, state, isActive } = req.query;

    const filter = {};
    if (search)   filter.$text    = { $search: search };
    if (city)     filter.city     = city.toLowerCase().trim();
    if (state)    filter.state    = state.toLowerCase().trim();
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Hospital.countDocuments(filter);

    const hospitals = await Hospital
      .find(filter)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Attach branch count per hospital
    const hospitalIds = hospitals.map((h) => h._id);
    const branchCounts = await Branch.aggregate([
      { $match: { hospital: { $in: hospitalIds }, isActive: true } },
      { $group: { _id: '$hospital', count: { $sum: 1 } } },
    ]);

    const countMap = {};
    branchCounts.forEach((b) => { countMap[b._id.toString()] = b.count; });

    const result = hospitals.map((h) => ({
      ...h.toObject(),
      branchCount: countMap[h._id.toString()] ?? 0,
    }));

    return sendSuccess(res, {
      data: {
        hospitals: result,
        pagination: {
          total,
          page:       parseInt(page),
          limit:      parseInt(limit),
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/superadmin/hospitals ────────────────────────────────────────────
export const createHospital = async (req, res, next) => {
  try {
    const {
      name, city, state, description,
      contactEmail, contactPhone, website,
    } = req.body;

    const hospital = await Hospital.create({
      name,
      city:         city.toLowerCase().trim(),
      state:        state.toLowerCase().trim(),
      description:  description  ?? '',
      contactEmail: contactEmail ?? '',
      contactPhone: contactPhone ?? '',
      website:      website      ?? '',
      createdBy:    req.user._id,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Hospital created',
      data: { hospital },
    });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/superadmin/hospitals/:id ───────────────────────────────────────
export const updateHospital = async (req, res, next) => {
  try {
    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return sendError(res, { statusCode: 404, message: 'Hospital not found' });
    }

    const allowed = [
      'name','city','state','description',
      'contactEmail','contactPhone','website','isActive',
    ];

    allowed.forEach((field) => {
      if (req.body[field] !== undefined) {
        hospital[field] = ['city','state'].includes(field)
          ? req.body[field].toLowerCase().trim()
          : req.body[field];
      }
    });

    await hospital.save();

    return sendSuccess(res, { message: 'Hospital updated', data: { hospital } });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/superadmin/admins ───────────────────────────────────────────────
export const createHospitalAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role, hospitalId, branchId } = req.body;

    // Verify hospital exists
    const hospital = await Hospital.findOne({ _id: hospitalId, isActive: true });
    if (!hospital) {
      return sendError(res, { statusCode: 404, message: 'Hospital not found' });
    }

    // If branch_admin — verify branch belongs to that hospital
    if (role === ROLES.BRANCH_ADMIN) {
      const branch = await Branch.findOne({ _id: branchId, hospital: hospitalId });
      if (!branch) {
        return sendError(res, { statusCode: 404, message: 'Branch not found in this hospital' });
      }
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, { statusCode: 409, message: 'Email already registered' });
    }

    const admin = await User.create({
      name,
      email,
      password,
      role,
      hospital:  hospitalId,
      branch:    role === ROLES.BRANCH_ADMIN ? branchId : null,
      createdBy: req.user._id,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: `${role === ROLES.OVERALL_ADMIN ? 'Overall' : 'Branch'} admin created`,
      data: {
        admin: {
          id:       admin._id,
          name:     admin.name,
          email:    admin.email,
          role:     admin.role,
          hospital: hospitalId,
          branch:   branchId ?? null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/superadmin/analytics ─────────────────────────────────────────────
export const getPlatformAnalytics = async (req, res, next) => {
  try {
    const today = getTodayIST();
    const { from = today, to = today } = req.query;

    // Platform totals for date range
    const totals = await AnalyticsDaily.aggregate([
      { $match: { date: { $gte: from, $lte: to } } },
      {
        $group: {
          _id:           null,
          totalTokens:   { $sum: '$totalTokens' },
          completed:     { $sum: '$completed' },
          skippedManual: { $sum: '$skippedManual' },
          skippedAuto:   { $sum: '$skippedAuto' },
          leftQueue:     { $sum: '$leftQueue' },
          avgWaitMin:    { $avg: '$avgWaitMin' },
        },
      },
    ]);

    // Top 5 busiest branches
    const topBranches = await AnalyticsDaily.aggregate([
      { $match: { date: { $gte: from, $lte: to } } },
      {
        $group: {
          _id:         '$branch',
          totalTokens: { $sum: '$totalTokens' },
        },
      },
      { $sort: { totalTokens: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from:         'branches',
          localField:   '_id',
          foreignField: '_id',
          as:           'branch',
        },
      },
      { $unwind: '$branch' },
      {
        $project: {
          totalTokens: 1,
          branchName:  '$branch.name',
          branchCity:  '$branch.city',
        },
      },
    ]);

    // Active hospitals and branch count
    const activeHospitals = await Hospital.countDocuments({ isActive: true });
    const activeBranches  = await Branch.countDocuments({ isActive: true });

    return sendSuccess(res, {
      data: {
        summary: totals[0] ?? {
          totalTokens: 0, completed: 0,
          skippedManual: 0, skippedAuto: 0,
          leftQueue: 0, avgWaitMin: 0,
        },
        topBranches,
        platform: { activeHospitals, activeBranches },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/superadmin/hospitals/:hospitalId/admins ──────────────────────────
// List all overall_admin and branch_admin for a hospital
export const getHospitalAdmins = async (req, res, next) => {
  try {
    const { hospitalId } = req.params;

    const hospital = await Hospital.findById(hospitalId).select('name');
    if (!hospital) {
      return sendError(res, { statusCode: 404, message: 'Hospital not found' });
    }

    const admins = await User
      .find({
        hospital: hospitalId,
        role:     { $in: [ROLES.OVERALL_ADMIN, ROLES.BRANCH_ADMIN] },
      })
      .populate('branch', 'name city')
      .select('name email role branch isActive createdAt')
      .sort({ role: 1, name: 1 });

    return sendSuccess(res, {
      data: { hospital, admins },
    });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/superadmin/admins/:id ─────────────────────────────────────────
// Update admin name, email, or active status
export const updateHospitalAdmin = async (req, res, next) => {
  try {
    const admin = await User.findOne({
      _id:  req.params.id,
      role: { $in: [ROLES.OVERALL_ADMIN, ROLES.BRANCH_ADMIN] },
    });

    if (!admin) {
      return sendError(res, { statusCode: 404, message: 'Admin not found' });
    }

    const { name, email, isActive } = req.body;

    if (name)     admin.name     = name;
    if (isActive !== undefined) admin.isActive = isActive;

    // If email is changing — check uniqueness
    if (email && email !== admin.email) {
      const exists = await User.findOne({ email });
      if (exists) {
        return sendError(res, { statusCode: 409, message: 'Email already in use' });
      }
      admin.email = email;
    }

    await admin.save();

    return sendSuccess(res, {
      message: 'Admin updated',
      data: {
        admin: {
          id:       admin._id,
          name:     admin.name,
          email:    admin.email,
          role:     admin.role,
          isActive: admin.isActive,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/superadmin/admins/:id ─────────────────────────────────────────
// Soft delete — deactivates the admin
export const deleteHospitalAdmin = async (req, res, next) => {
  try {
    const admin = await User.findOne({
      _id:  req.params.id,
      role: { $in: [ROLES.OVERALL_ADMIN, ROLES.BRANCH_ADMIN] },
    });

    if (!admin) {
      return sendError(res, { statusCode: 404, message: 'Admin not found' });
    }

    admin.isActive = false;
    await admin.save();

    return sendSuccess(res, { message: 'Admin removed successfully' });
  } catch (err) {
    next(err);
  }
};
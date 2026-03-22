import { User, ROLES }    from '../models/User.js';
import { signAccessToken } from '../utils/jwtUtil.js';
import { sendSuccess, sendError } from '../utils/responseUtil.js';
import { verifyAccessToken }      from '../utils/jwtUtil.js';

// ── Register ──────────────────────────────────────────────────────────────────
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, hospitalId, branchId } = req.body;

    // Default to patient if no role provided
    const requestedRole = role?.toLowerCase().trim() || ROLES.PATIENT;

    // Validate role is a known value
    if (!Object.values(ROLES).includes(requestedRole)) {
      return sendError(res, {
        statusCode: 400,
        message:    `Invalid role. Must be one of: ${Object.values(ROLES).join(', ')}`,
      });
    }

    // ── Role-based access control ─────────────────────────────────────────────

    if (requestedRole === ROLES.SUPER_ADMIN) {
      // Super admin can only be created if none exists yet
      const existing = await User.findOne({ role: ROLES.SUPER_ADMIN });
      if (existing) {
        return sendError(res, {
          statusCode: 403,
          message:    'Super admin already exists. Only one super admin is allowed.',
        });
      }
      // No auth required — this is first-time platform setup
    }

    else if (
      requestedRole === ROLES.OVERALL_ADMIN ||
      requestedRole === ROLES.BRANCH_ADMIN
    ) {
      // Requires super admin JWT
      const callerUser = await getCallerFromToken(req);
      if (!callerUser || callerUser.role !== ROLES.SUPER_ADMIN) {
        return sendError(res, {
          statusCode: 403,
          message:    'Only super admin can create hospital admins.',
        });
      }
      if (!hospitalId) {
        return sendError(res, {
          statusCode: 400,
          message:    'hospitalId is required for this role.',
        });
      }
      if (requestedRole === ROLES.BRANCH_ADMIN && !branchId) {
        return sendError(res, {
          statusCode: 400,
          message:    'branchId is required for branch_admin role.',
        });
      }
    }

    else if (requestedRole === ROLES.STAFF) {
      // Requires overall_admin or branch_admin JWT
      const callerUser = await getCallerFromToken(req);
      if (
        !callerUser ||
        ![ROLES.OVERALL_ADMIN, ROLES.BRANCH_ADMIN, ROLES.SUPER_ADMIN].includes(callerUser.role)
      ) {
        return sendError(res, {
          statusCode: 403,
          message:    'Only admins can create staff accounts.',
        });
      }
      if (!branchId) {
        return sendError(res, {
          statusCode: 400,
          message:    'branchId is required for staff role.',
        });
      }
    }

    // patient — no auth required, open to all

    // ── Check email uniqueness ────────────────────────────────────────────────
    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, { statusCode: 409, message: 'Email already registered' });
    }

    // ── Get caller for createdBy field ────────────────────────────────────────
    const callerUser = await getCallerFromToken(req);

    // ── Create user ───────────────────────────────────────────────────────────
    const user = await User.create({
      name,
      email,
      password,
      role:      requestedRole,
      hospital:  hospitalId || null,
      branch:    branchId   || null,
      isActive:  true,
      createdBy: callerUser?._id || null,
    });

    const accessToken = signAccessToken(user);

    return sendSuccess(res, {
      statusCode: 201,
      message:    `${requestedRole.replace('_', ' ')} registered successfully`,
      data: {
        accessToken,
        user: {
          id:       user._id,
          name:     user.name,
          email:    user.email,
          role:     user.role,
          hospital: user.hospital,
          branch:   user.branch,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return sendError(res, { statusCode: 401, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return sendError(res, {
        statusCode: 403,
        message:    'Account is deactivated. Contact your administrator.',
      });
    }

    const accessToken = signAccessToken(user);

    return sendSuccess(res, {
      message: 'Logged in successfully',
      data: {
        accessToken,
        user: {
          id:       user._id,
          name:     user.name,
          email:    user.email,
          role:     user.role,
          hospital: user.hospital,
          branch:   user.branch,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ── Logout ────────────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
  return sendSuccess(res, { message: 'Logged out successfully' });
};

// ── Get current user ──────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  return sendSuccess(res, {
    data: {
      id:       req.user._id,
      name:     req.user.name,
      email:    req.user.email,
      role:     req.user.role,
      hospital: req.user.hospital,
      branch:   req.user.branch,
    },
  });
};

// ── Helper: extract caller from Authorization header (optional) ───────────────
// Returns null if no token or invalid — does NOT throw
const getCallerFromToken = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token   = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    const user    = await User.findById(decoded.id).select('-password');

    return user?.isActive ? user : null;
  } catch {
    return null;
  }
};
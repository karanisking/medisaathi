import { verifyAccessToken } from '../utils/jwtUtil.js';
import { sendError } from '../utils/responseUtil.js';
import { User } from '../models/user.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, { statusCode: 401, message: 'No token provided' });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return sendError(res, { statusCode: 401, message: 'User no longer exists' });
    }

    if (!user.isActive) {
      return sendError(res, { statusCode: 403, message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, { statusCode: 401, message: 'Token expired — please log in again' });
    }
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, { statusCode: 401, message: 'Invalid token' });
    }
    next(err);
  }
};
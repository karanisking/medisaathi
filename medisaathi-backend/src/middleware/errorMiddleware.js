

/**
 * Global Express error handler.
 * Must be registered LAST in app.js (after all routes).
 *
 * Handles:
 * - Mongoose validation errors
 * - Mongoose duplicate key errors (E11000)
 * - Mongoose cast errors (bad ObjectId)
 * - Generic errors
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Internal server error';

  // Mongoose validation error (e.g. required field missing)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  // Mongoose duplicate key (e.g. email already exists)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // Mongoose bad ObjectId (e.g. /hospitals/not-a-valid-id)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // In development, include the full stack trace
  const response = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  console.error(`[Error] ${statusCode} — ${message}`);

  res.status(statusCode).json(response);
};
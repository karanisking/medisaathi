import { body, param, query, validationResult } from 'express-validator';
import { PROBLEM_TYPES } from '../models/token.js';
import { ROLES } from '../models/user.js';
import { sendError } from '../utils/responseUtil.js';

// ── Runner ────────────────────────────────────────────────────────────────────

/**
 * Place this AFTER your express-validator chains in the route.
 * Returns 422 with all field errors if anything fails.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((e) => ({
      field:   e.path,
      message: e.msg,
    }));
    return sendError(res, {
      statusCode: 422,
      message:    'Validation failed',
      errors:     messages,
    });
  }
  next();
};

// ── Auth validators ───────────────────────────────────────────────────────────

export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),
];

export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ── Hospital validators ───────────────────────────────────────────────────────

export const validateCreateHospital = [
  body('name')
    .trim()
    .notEmpty().withMessage('Hospital name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('city')
    .trim()
    .notEmpty().withMessage('City is required')
    .isLength({ min: 2, max: 60 }).withMessage('City must be 2–60 characters'),

  body('state')
    .trim()
    .notEmpty().withMessage('State is required')
    .isLength({ min: 2, max: 60 }).withMessage('State must be 2–60 characters'),

  body('contactEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Contact email must be valid')
    .normalizeEmail(),

  body('contactPhone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]{7,15}$/).withMessage('Invalid phone number format'),


  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

    body('website')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ require_protocol: false })
    .withMessage('Website must be a valid URL'),
];

export const validateUpdateHospital = [
  param('id')
    .isMongoId().withMessage('Invalid hospital ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage('City must be 2–60 characters'),

  body('state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage('State must be 2–60 characters'),

  body('contactEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Contact email must be valid')
    .normalizeEmail(),

  body('contactPhone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]{7,15}$/).withMessage('Invalid phone number format'),



  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be true or false'),

    body('website')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ require_protocol: false })
    .withMessage('Website must be a valid URL'),
];

// ── Branch validators ─────────────────────────────────────────────────────────

export const validateCreateBranch = [
  body('name')
    .trim()
    .notEmpty().withMessage('Branch name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('city')
    .trim()
    .notEmpty().withMessage('City is required')
    .isLength({ min: 2, max: 60 }).withMessage('City must be 2–60 characters'),

  body('state')
    .trim()
    .notEmpty().withMessage('State is required')
    .isLength({ min: 2, max: 60 }).withMessage('State must be 2–60 characters'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Address cannot exceed 200 characters'),

  body('contactPhone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]{7,15}$/).withMessage('Invalid phone number format'),

  body('contactEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Contact email must be valid')
    .normalizeEmail(),

  body('openTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('openTime must be HH:MM format'),

  body('closeTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('closeTime must be HH:MM format'),

  body('skipTimeoutSec')
    .optional()
    .isInt({ min: 10, max: 120 }).withMessage('skipTimeoutSec must be between 10 and 120'),

  body('problemCategories')
    .optional()
    .isArray({ min: 1 }).withMessage('problemCategories must be a non-empty array')
    .custom((categories) => {
      const valid = Object.values(PROBLEM_TYPES);
      const invalid = categories.filter((c) => !valid.includes(c));
      if (invalid.length > 0) {
        throw new Error(`Invalid categories: ${invalid.join(', ')}`);
      }
      return true;
    }),
];

export const validateUpdateBranch = [
  param('id')
    .isMongoId().withMessage('Invalid branch ID'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

  body('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage('City must be 2–60 characters'),

  body('state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage('State must be 2–60 characters'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Address cannot exceed 200 characters'),

  body('contactPhone')
    .optional()
    .trim()
    .matches(/^[0-9+\-\s()]{7,15}$/).withMessage('Invalid phone number format'),

  body('contactEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Contact email must be valid')
    .normalizeEmail(),

  body('openTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('openTime must be HH:MM format'),

  body('closeTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('closeTime must be HH:MM format'),

  body('queueEnabled')
    .optional()
    .isBoolean().withMessage('queueEnabled must be true or false'),

  body('skipTimeoutSec')
    .optional()
    .isInt({ min: 10, max: 120 }).withMessage('skipTimeoutSec must be between 10 and 120'),

  body('problemCategories')
    .optional()
    .isArray({ min: 1 }).withMessage('problemCategories must be a non-empty array')
    .custom((categories) => {
      const valid = Object.values(PROBLEM_TYPES);
      const invalid = categories.filter((c) => !valid.includes(c));
      if (invalid.length > 0) {
        throw new Error(`Invalid categories: ${invalid.join(', ')}`);
      }
      return true;
    }),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be true or false'),
];

// ── Admin user creation validators ────────────────────────────────────────────

export const validateCreateAdmin = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn([ROLES.OVERALL_ADMIN, ROLES.BRANCH_ADMIN])
    .withMessage('Role must be overall_admin or branch_admin'),

  body('hospitalId')
    .notEmpty().withMessage('Hospital ID is required')
    .isMongoId().withMessage('Invalid hospital ID'),

  // Required only when role === branch_admin
  body('branchId')
    .if(body('role').equals(ROLES.BRANCH_ADMIN))
    .notEmpty().withMessage('Branch ID is required for branch_admin')
    .isMongoId().withMessage('Invalid branch ID'),
];

export const validateCreateStaff = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/\d/).withMessage('Password must contain at least one number'),

  body('branchId')
    .notEmpty().withMessage('Branch ID is required')
    .isMongoId().withMessage('Invalid branch ID'),
];

// ── Token (queue join) validators ─────────────────────────────────────────────

export const validateJoinQueue = [
  body('branchId')
    .notEmpty().withMessage('Branch ID is required')
    .isMongoId().withMessage('Invalid branch ID'),

  body('problemType')
    .notEmpty().withMessage('Problem type is required')
    .isIn(Object.values(PROBLEM_TYPES))
    .withMessage(`Problem type must be one of: ${Object.values(PROBLEM_TYPES).join(', ')}`),

  body('problemNote')
    .if(body('problemType').equals(PROBLEM_TYPES.OTHER))
    .notEmpty().withMessage('Please describe your problem when selecting Other')
    .isLength({ max: 300 }).withMessage('Problem note cannot exceed 300 characters'),
];

// ── Param validators (shared) ─────────────────────────────────────────────────

export const validateMongoId = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage(`Invalid ${paramName}`),
];

// ── Query validators ──────────────────────────────────────────────────────────

export const validateHospitalQuery = [
  query('city')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage('City filter must be 2–60 characters'),

  query('state')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage('State filter must be 2–60 characters'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 }).withMessage('Search query must be 1–100 characters'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];
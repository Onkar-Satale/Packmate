import { body, validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map((err) => err.msg).join(", ");
    return next(new ApiError(400, errorMsg));
  }
  next();
};

const registerValidator = [
  body("firstName").trim().notEmpty().withMessage("First name is required"),
  body("lastName").optional().trim(),
  body("email").trim().isEmail().withMessage("Must be a valid email address").normalizeEmail(),
  body("password")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long")
    .matches(/[A-Z]/).withMessage("Must contain at least one uppercase letter")
    .matches(/[a-z]/).withMessage("Must contain at least one lowercase letter")
    .matches(/[0-9]/).withMessage("Must contain at least one number"),
  validateRequest,
];

const loginValidator = [
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest,
];

export {
  registerValidator,
  loginValidator,
  validateRequest
};

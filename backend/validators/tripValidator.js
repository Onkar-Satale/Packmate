// Validation rules for trip creation and update payloads using express-validator

import { body } from 'express-validator';
import { validateRequest } from './authValidator.js';

// Validation middleware chain for trip creation
const tripValidator = [
  body("destination").notEmpty().withMessage("Destination is required").isString().withMessage("Destination must be a string"),
  body("startDate").notEmpty().withMessage("Start date is required").isISO8601().toDate().withMessage("startDate must be a valid date"),
  body("endDate").notEmpty().withMessage("End date is required").isISO8601().toDate().withMessage("endDate must be a valid date"),
  body("totalDays").optional().isInt({ min: 1 }).withMessage("totalDays must be a positive integer"),
  body("kids").optional().isInt({ min: 0 }).withMessage("kids must be a non-negative integer"),
  body("elders").optional().isInt({ min: 0 }).withMessage("elders must be a non-negative integer"),
  body("travelers").optional().isArray().withMessage("travelers must be an array"),
  validateRequest,
];

// Validation middleware chain for trip updates
const updateTripValidator = [
  body("destination").optional().notEmpty().withMessage("Destination cannot be empty"),
  body("startDate").optional().isISO8601().toDate().withMessage("startDate must be a valid date"),
  body("endDate").optional().isISO8601().toDate().withMessage("endDate must be a valid date"),
  body("totalDays").optional().isInt({ min: 1 }).withMessage("totalDays must be a positive integer"),
  body("kids").optional().isInt({ min: 0 }).withMessage("kids must be a non-negative integer"),
  body("elders").optional().isInt({ min: 0 }).withMessage("elders must be a non-negative integer"),
  body("travelers").optional().isArray().withMessage("travelers must be an array"),
  body("notes").optional().isArray().withMessage("notes must be an array of objects"),
  validateRequest,
];

export {
  tripValidator,
  updateTripValidator
};


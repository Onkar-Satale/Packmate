// Validation rules for GenAI proxy endpoints (weather prefetch, packing list generation, suitcase analysis, chat)

import { body } from 'express-validator';
import { validateRequest } from './authValidator.js';

// Validation middleware for weather prefetching
const prefetchWeatherValidator = [
  body("destination").notEmpty().withMessage("Destination is required").isString(),
  validateRequest,
];

// Validation middleware for AI packing list generation
const generatePackingListValidator = [
  body("destination").notEmpty().isString(),
  body("days").isInt({ min: 1, max: 120 }),
  body("trip_type").notEmpty().isString(),
  body("purpose").notEmpty().isString(),
  body("activities").notEmpty().isString(),
  body("stay_type").notEmpty().isString(),
  body("budget").notEmpty().isString(),
  body("food").notEmpty().isString(),
  body("luggage").notEmpty().isString(),
  body("travel_type").notEmpty().isString(),
  body("travelers").notEmpty().isString(),
  body("temperature").optional({ nullable: true }).isNumeric(),
  body("start_date").notEmpty().isString(),
  body("end_date").notEmpty().isString(),
  validateRequest,
];

// Validation middleware for Word document download generation
const downloadPackingListValidator = [
  body("packing_list").isArray().notEmpty().withMessage("packing_list must be a non-empty array"),
  validateRequest,
];

// Validation middleware for vision-based suitcase capacity analysis
const analyzeSuitcaseValidator = [
  body("image_base64").notEmpty().withMessage("Image data is required").isString(),
  body("packing_list").isArray().notEmpty().withMessage("packing_list must be a non-empty array"),
  body("destination").notEmpty().isString(),
  body("duration").isInt({ min: 1 }),
  body("activities").notEmpty().isString(),
  body("start_date").optional({ nullable: true }).isString(),
  body("end_date").optional({ nullable: true }).isString(),
  validateRequest,
];

// Validation middleware for RAG travel chatbot requests
const chatValidator = [
  body("message").notEmpty().withMessage("Message is required").isString().withMessage("Message must be a string"),
  validateRequest,
];

export {
  prefetchWeatherValidator,
  generatePackingListValidator,
  downloadPackingListValidator,
  analyzeSuitcaseValidator,
  chatValidator,
};


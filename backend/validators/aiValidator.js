const { body } = require("express-validator");  // express-validator-Library to validate request data
const { validateRequest } = require("./authValidator");

const prefetchWeatherValidator = [
  body("location").notEmpty().withMessage("Location is required").isString(),
  validateRequest,
];

const generatePackingListValidator = [
  body("location").notEmpty().isString(),
  body("days").isInt({ min: 1, max: 120 }),
  body("trip_type").notEmpty().isString(),
  body("purpose").notEmpty().isString(),
  body("activities").notEmpty().isString(),
  body("stay_type").notEmpty().isString(),
  body("budget").notEmpty().isString(),
  body("food").notEmpty().isString(),
  body("luggage").notEmpty().isString(),
  body("travel_type").notEmpty().isString(),
  body("people").notEmpty().isString(),
  body("temperature").optional({ nullable: true }).isNumeric(),
  body("start_date").notEmpty().isString(),
  body("end_date").notEmpty().isString(),
  validateRequest,
];

const downloadPackingListValidator = [
  body("packing_list").isArray().notEmpty().withMessage("packing_list must be a non-empty array"),
  validateRequest,
];

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

const chatValidator = [
  body("message").notEmpty().withMessage("Message is required").isString().withMessage("Message must be a string"),
  validateRequest,
];

module.exports = {
  prefetchWeatherValidator,
  generatePackingListValidator,
  downloadPackingListValidator,
  analyzeSuitcaseValidator,
  chatValidator,
};

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const authMiddleware = require("../middleware/auth");
const {
  prefetchWeatherValidator,
  generatePackingListValidator,
  downloadPackingListValidator,
  analyzeSuitcaseValidator,
  chatValidator,
} = require("../validators/aiValidator");
const aiController = require("../controllers/aiController");

// Extremely strict rate limiting for AI generation to prevent abuse, similar to what Python had
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: { success: false, message: "Too many AI requests, please try again later." },
});

// We enforce authentication for all AI routes, explicitly protecting our LLM infrastructure
router.use(authMiddleware);

router.post("/prefetch-weather", prefetchWeatherValidator, aiController.prefetchWeather);

router.post(
  "/generate-packing-list",
  aiLimiter,
  generatePackingListValidator,
  aiController.generatePackingList
);

router.post(
  "/download-packing-list",
  downloadPackingListValidator,
  aiController.downloadPackingList
);

router.post(
  "/analyze-suitcase",
  analyzeSuitcaseValidator,
  aiController.analyzeSuitcase
);

router.post(
  "/chat",
  chatValidator,
  aiController.chat
);

module.exports = router;

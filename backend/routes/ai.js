import express from 'express';
import rateLimit from 'express-rate-limit';
import authMiddleware from '../middlewares/auth.js';
import {
  prefetchWeatherValidator,
  generatePackingListValidator,
  downloadPackingListValidator,
  analyzeSuitcaseValidator,
} from '../validators/aiValidator.js';
import * as aiController from '../controllers/aiController.js';

const router = express.Router();

// Extremely strict rate limiting for AI generation to prevent abuse, similar to what Python had
const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: { success: false, message: "Too many AI requests, please try again later." },
});

// We enforce authentication for all AI routes, explicitly protecting our LLM infrastructure
router.use(authMiddleware);

router.post(
  "/prefetch-weather",
  prefetchWeatherValidator,
  aiController.prefetchWeather);

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

export default router;

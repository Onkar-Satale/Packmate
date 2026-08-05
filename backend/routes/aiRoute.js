import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import { aiRateLimiter } from '../middlewares/rateLimiterMiddleware.js';
import {
  prefetchWeatherValidator,
  generatePackingListValidator,
  downloadPackingListValidator,
  analyzeSuitcaseValidator,
} from '../validators/aiValidator.js';
import * as aiController from '../controllers/aiController.js';

const router = express.Router();

// We enforce authentication for all AI routes, explicitly protecting our LLM infrastructure
router.use(authMiddleware);

router.post(
  "/prefetch-weather",
  prefetchWeatherValidator,
  aiController.prefetchWeather);

router.post(
  "/generate-packing-list",
  aiRateLimiter,
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
  aiRateLimiter,
  analyzeSuitcaseValidator,
  aiController.analyzeSuitcase
);

export default router;

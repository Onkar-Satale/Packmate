// Router declarations for AI microservice proxy endpoints (weather prefetch, packing list generation, file download, suitcase analysis)

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

// Endpoint for prefetching weather forecasts for trip destinations
router.post(
  "/prefetch-weather",
  prefetchWeatherValidator,
  aiController.prefetchWeather);

// Endpoint for generating customized packing lists via GenAI
router.post(
  "/generate-packing-list",
  aiRateLimiter,
  generatePackingListValidator,
  aiController.generatePackingList
);

// Endpoint for downloading packing list as a formatted Word document
router.post(
  "/download-packing-list",
  downloadPackingListValidator,
  aiController.downloadPackingList
);

// Endpoint for computer vision suitcase capacity analysis
router.post(
  "/analyze-suitcase",
  aiRateLimiter,
  analyzeSuitcaseValidator,
  aiController.analyzeSuitcase
);

export default router;


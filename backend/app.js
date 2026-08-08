// Express application setup, configuring security headers, CORS policy, body parsers, logging, rate limiting, and route mounts

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import errorHandler from './middlewares/errorHandlerMiddleware.js';
import { apiRateLimiter } from './middlewares/rateLimiterMiddleware.js';
import logger from './utils/logger.js';
import authRoutes from './routes/authRoute.js';
import tripRoutes from './routes/tripRoute.js';
import aiRoutes from './routes/aiRoute.js';
import * as aiController from './controllers/aiController.js';
import { chatValidator } from './validators/aiValidator.js';

const app = express();
app.set("trust proxy", 1);

// Security Headers & Dynamic CORS configuration
app.use(helmet());

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
  : [];

app.use(cors({
  origin: function (origin, callback) {
    // Dynamically allow requests from allowed origins or local development servers
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked this Origin: ${origin}`);
      callback(new Error('CORS blocked origin'), false);
    }
  },
  credentials: true
}));

// Request Body & Cookie Parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// HTTP Request Logging
app.use(morgan("dev"));

// API Rate Limiting
app.use("/api", apiRateLimiter);

// API Route Mounts
app.post('/api/travel-chat', chatValidator, aiController.travelChat);
app.use('/api', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/ai', aiRoutes);

// Health Check Endpoint
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Backend is running securely' });
});

// Centralized Error Handling Pipeline
app.use(errorHandler);

export default app;

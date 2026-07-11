import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';

import errorHandler from './middlewares/errorHandler.js';
import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import aiRoutes from './routes/ai.js';
import * as aiController from './controllers/aiController.js';
import { chatValidator } from './validators/aiValidator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);

// 1. Security Middlewares
app.use(helmet());
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
  : [];

app.use(cors({
  origin: function (origin, callback) {
    // Dynamically allow origins hitting the local proxy from dev servers
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      callback(null, true);
    } else {
      console.warn('CORS blocked this Origin:', origin);
      callback(new Error('CORS blocked origin'), false);
    }
  },
  credentials: true
}));

// 2. Parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser()); // Enable HTTP-only cookie parsing
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// OpenAPI / Swagger Documentation

try {
  const swaggerDocument = YAML.load(path.join(__dirname, "docs/swagger.yaml"));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
  console.error("Failed to load swagger.yaml", e);
}

// 3. Activity Logging
app.use(morgan("dev"));

// 4. Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100,
  message: { success: false, message: "Too many requests, please try again later." }
});
app.use("/api/login", apiLimiter);
app.use("/api/register", apiLimiter);

// 5. Mount API Routes
app.post('/api/travel-chat', chatValidator, aiController.travelChat);
app.get('/api/debug-rag', aiController.debugRag);
app.use('/api', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Backend is running securely' });
});

// 6. Centralized Error Pipeline
app.use(errorHandler);

export default app;

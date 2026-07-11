import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: "packmate-api" },
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, "../logs/error.log"), 
      level: "error",
      maxsize: 5 * 1024 * 1024, // 5MB limit per file
      maxFiles: 5 // Keep maximum 5 rotated files
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, "../logs/combined.log"),
      maxsize: 5 * 1024 * 1024, // 5MB limit
      maxFiles: 5 // Keep maximum 5 rotated files
    }),
  ],
});

// Write console output naturally when running in development mode
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;

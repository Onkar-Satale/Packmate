// Centralized Express error handler mapping database exceptions to standardized ApiError responses with structured Winston logging

import ApiError from '../utils/ApiError.js';
import logger from '../utils/logger.js';

// Global Express error interceptor middleware
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Map MongoDB Invalid ObjectId error
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    error = new ApiError(404, message);
  }

  // Map MongoDB Duplicate Key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `An account with that ${field} already exists. Please use a different one.`;
    error = new ApiError(400, message);
  }

  // Map Mongoose Schema Validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((val) => val.message).join(", ");
    error = new ApiError(400, message);
  }

  // Wrap generic unexpected exceptions
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500; 
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message, false, err.stack);
  }

  const response = {
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };

  // Structured HTTP request error logging
  const logMessage = `${error.statusCode} - ${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`;
  const logMeta = {
    statusCode: error.statusCode,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    stack: error.stack,
  };

  if (error.statusCode >= 500) {
    logger.error(logMessage, logMeta);
  } else {
    logger.warn(logMessage, { ...logMeta, stack: undefined });
  }

  res.status(error.statusCode).json(response);
};

export default errorHandler;


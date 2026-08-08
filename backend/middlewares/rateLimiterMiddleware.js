// Rate limiting middleware definitions for auth endpoints, general API endpoints, and heavy AI tasks

import rateLimit from 'express-rate-limit';

// Strict rate limiter for authentication routes (login, register)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true, 
  legacyHeaders: false, 
  message: {
    success: false,
    error: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
});

// General rate limiter for general API routes
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  standardHeaders: true, 
  legacyHeaders: false, 
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after a minute',
  },
});

// Strict rate limiter for resource-intensive LLM/Vision AI operations
export const aiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    success: false, 
    message: 'Too many AI requests, please try again later.' 
  },
});


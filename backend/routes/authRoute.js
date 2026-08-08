// Authentication router mapping register, login, token refresh, logout, and delete account endpoints

import express from 'express';
import { register, login, refreshToken, logout, deleteAccount } from '../controllers/authController.js';
import { registerValidator, loginValidator } from '../validators/authValidator.js';
import auth from '../middlewares/authMiddleware.js';
import { authRateLimiter } from '../middlewares/rateLimiterMiddleware.js';

const router = express.Router();

// User Registration & Login Endpoints
router.post("/register", authRateLimiter, registerValidator, register);
router.post("/login", authRateLimiter, loginValidator, login);

// Session & Token Refresh Endpoints
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// Account Management Endpoints
router.delete("/delete-account", auth, deleteAccount);

export default router;

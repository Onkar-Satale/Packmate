import express from 'express';
import { register, login, refreshToken, logout, deleteAccount } from '../controllers/authController.js';
import { registerValidator, loginValidator } from '../validators/authValidator.js';
import auth from '../middlewares/authMiddleware.js';
import { authRateLimiter } from '../middlewares/rateLimiterMiddleware.js';

const router = express.Router();

router.post("/register", authRateLimiter, registerValidator, register);
router.post("/login", authRateLimiter, loginValidator, login);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.delete("/delete-account", auth, deleteAccount);

export default router;

// JWT Bearer token authentication middleware for protecting private backend routes

import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';

// Verifies Authorization header Bearer token and attaches decoded userId to req
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "No Bearer token provided"));
    }

    const token = authHeader?.split(" ")[1];
    if (!token) {
      return next(new ApiError(401, "No token found in Bearer string"));
    }

    const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.userId;

    next();
  } catch (err) {
    next(new ApiError(401, "Invalid or expired token", true, err.stack));
  }
};

export default authMiddleware;


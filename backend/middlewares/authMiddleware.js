import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError.js';

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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // Consistent user ID assignment

    next();
  } catch (err) {
    next(new ApiError(401, "Invalid or expired token", true, err.stack));
  }
};

export default authMiddleware;


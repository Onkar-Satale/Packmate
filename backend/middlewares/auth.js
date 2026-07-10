const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");

module.exports = (req, res, next) => {
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
    console.error("Auth Middleware Error:", err.message);
    next(new ApiError(401, "Invalid or expired token"));
  }
};


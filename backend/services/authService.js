// Authentication service layer managing user database operations, bcrypt password verification, JWT token issuance, refresh token management, and account deletion

import User from '../models/userModel.js';
import Trip from '../models/tripModel.js';
import jwt from 'jsonwebtoken';

class AuthService {
  // Locates a user by email, explicitly including password field for credential verification
  async findUserByEmail(email) {
    const lowercasedEmail = email ? email.toLowerCase() : email;
    return await User.findOne({ email: lowercasedEmail }).select("+password");
  }

  // Locates user document by ID, selecting stored refreshToken field
  async findUserWithRefreshToken(userId) {
    return await User.findById(userId).select("+refreshToken");
  }

  // Creates a new user record. Password hashing is executed via Mongoose pre-save hook
  async registerUser(userData) {
    const user = await User.create(userData);
    return user;
  }

  // Compares plain candidate password against user's stored bcrypt hash
  async verifyPassword(plainPassword, user) {
    return await user.comparePassword(plainPassword);
  }

  // Generates short-lived JWT access token
  generateAuthToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN}
    );
  }

  // Generates long-lived JWT refresh token
  generateRefreshToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
  }

  // Saves refresh token to user record in database
  async storeRefreshToken(userId, token) {
    return await User.findByIdAndUpdate(userId, { refreshToken: token });
  }

  // Clears refresh token field from user document during logout
  async clearRefreshToken(userId) {
    return await User.findByIdAndUpdate(userId, { $unset: { refreshToken: "" } });
  }

  // Permanently deletes user account and all associated trip documents
  async deleteUser(userId) {
    await Trip.deleteMany({ userId: userId });
    return await User.findByIdAndDelete(userId);
  }

  // Verifies JWT refresh token validity and returns decoded token payload
  verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET );
  }
}

export default new AuthService();


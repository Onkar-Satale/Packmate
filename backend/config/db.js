// MongoDB database connection setup using Mongoose

import mongoose from 'mongoose';
import logger from '../utils/logger.js';

// Asynchronously establishes connection to MongoDB database using Mongoose
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
};

export default connectDB;

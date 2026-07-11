import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        logger.info(`✅ MongoDB connected: ${conn.connection.host}`);
        
        // Safely drop the legacy username index so it stops causing errors on signups
        try {
            await mongoose.connection.collection('users').dropIndex('username_1');
            logger.info('✅ Dropped legacy username_1 index from users collection');
        } catch (e) {
            // Ignore if index doesn't exist
            if (e.codeName !== 'IndexNotFound') {
                logger.warn(`Note: Did not drop username_1 index: ${e.message}`);
            }
        }
    } catch (err) {
        logger.error('❌ MongoDB connection error:', err);
        process.exit(1); // Exit process with failure
    }
};

export default connectDB;

import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`✅ MongoDB connected: ${conn.connection.host}`);
        
        // Safely drop the legacy username index so it stops causing errors on signups
        try {
            await mongoose.connection.collection('users').dropIndex('username_1');
            console.log('✅ Dropped legacy username_1 index from users collection');
        } catch (e) {
            // Ignore if index doesn't exist
            if (e.codeName !== 'IndexNotFound') {
                console.log('Note: Did not drop username_1 index:', e.message);
            }
        }
    } catch (err) {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1); // Exit process with failure
    }
};

export default connectDB;

const mongoose = require('mongoose');

const logDbWarning = (nodeEnv, message) => {
    if (nodeEnv === 'production') {
        console.error('❌ CRITICAL:', message);
        console.log('🚀 Server will continue but API endpoints will fail');
    } else {
        console.log('🚀 Development mode: Server will continue without database');
    }
};

const connectToDatabase = async () => {
    const dbURL = process.env.DB_URL;
    const nodeEnv = process.env.NODE_ENV || 'development';
    const debug = process.env.DB_DEBUG === 'true';

    if (debug) {
        console.log('🔍 Database connection debug:');
        console.log('   Environment:', nodeEnv);
        console.log('   DB_URL exists:', !!dbURL);
    }

    if (!dbURL) {
        logDbWarning(nodeEnv, 'DB_URL environment variable is not set in production!');
        return;
    }

    try {
        if (debug) console.log('🔄 Attempting to connect to MongoDB...');
        const options = {
            serverSelectionTimeoutMS: 10000, // 10 second timeout
            socketTimeoutMS: 45000, // 45 second timeout
        };
        
        await mongoose.connect(dbURL, options);
        console.log('✅ Successfully connected to the database');
        if (debug) console.log('   Database name:', mongoose.connection.name);
    } catch (error) {
        logDbWarning(nodeEnv, `Database connection error: ${error.message}`);
    }
};

module.exports = connectToDatabase;

const mongoose = require('mongoose');

const connectToDatabase = async () => {
    const dbURL = process.env.DB_URL;
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    console.log('🔍 Database connection debug:');
    console.log('   Environment:', nodeEnv);
    console.log('   DB_URL exists:', !!dbURL);
    if (dbURL) {
        console.log('   DB_URL starts with:', dbURL.substring(0, 20) + '...');
        console.log('   DB_URL length:', dbURL.length);
    }
    
    // In production, we need the database to work
    if (!dbURL) {
        if (nodeEnv === 'production') {
            console.error('❌ CRITICAL: DB_URL environment variable is not set in production!');
            console.log('💡 To fix this:');
            console.log('   1. Go to your Render dashboard');
            console.log('   2. Navigate to your service');
            console.log('   3. Go to Environment tab');
            console.log('   4. Add environment variable: DB_URL');
            console.log('   5. Set it to your MongoDB Atlas connection string');
            console.log('');
            console.log('🔗 MongoDB Atlas connection string format:');
            console.log('   mongodb+srv://username:password@cluster.mongodb.net/griffin?retryWrites=true&w=majority');
            console.log('');
            console.log('🚀 Server will continue but API endpoints will fail');
        } else {
            console.log('🚀 Development mode: No database connection, using mock data');
        }
        return;
    }
    
    try {
        console.log('🔄 Attempting to connect to MongoDB...');
        const options = {
            serverSelectionTimeoutMS: 10000, // 10 second timeout
            socketTimeoutMS: 45000, // 45 second timeout
        };
        
        await mongoose.connect(dbURL, options);
        console.log('✅ Successfully connected to the database');
        console.log('   Database name:', mongoose.connection.name);
        console.log('   Connection state:', mongoose.connection.readyState);
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        if (nodeEnv === 'production') {
            console.log('🚀 Server will continue but API endpoints will fail');
        } else {
            console.log('🚀 Development mode: Server will continue without database');
        }
    }
};

module.exports = connectToDatabase;

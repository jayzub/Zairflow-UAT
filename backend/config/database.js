const mongoose = require('mongoose');

const connectToDatabase = async () => {
    const dbURL = process.env.DB_URL;
    
    if (!dbURL) {
        console.error('❌ Database connection failed: DB_URL environment variable is not set');
        console.log('💡 To fix this:');
        console.log('   1. Go to your Render dashboard');
        console.log('   2. Navigate to your service');
        console.log('   3. Go to Environment tab');
        console.log('   4. Add environment variable: DB_URL');
        console.log('   5. Set it to your MongoDB connection string');
        console.log('');
        console.log('🔗 You can use MongoDB Atlas (free tier):');
        console.log('   https://www.mongodb.com/atlas/database');
        console.log('');
        console.log('🚀 For now, the server will start without database connection');
        console.log('   API endpoints will return errors, but the frontend will load');
        return;
    }
    
    try {
        await mongoose.connect(dbURL);
        console.log('✅ Successfully connected to the database');
    } catch (error) {
        console.error('❌ Database connection error:', error);
        console.log('🚀 Server will continue without database connection');
        console.log('   API endpoints will return errors, but the frontend will load');
    }
};

module.exports = connectToDatabase;

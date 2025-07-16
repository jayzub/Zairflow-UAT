const mongoose = require('mongoose');

const connectToDatabase = async () => {
    const dbURL = process.env.DB_URL;
    try {
        await mongoose.connect(dbURL);
        console.log('Successfully connected to the database');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1); // Exit process if DB connection fails
    }
};

module.exports = connectToDatabase;

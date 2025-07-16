const { app, connectToDatabase } = require('./app');
const PORT = process.env.PORT || 3001;

const startServer = async () => {
  console.log(`Starting server on port ${PORT}...`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  try {
    // Connect to database first
    await connectToDatabase();
    
    // Start server after database connection
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Health check available at: http://localhost:${PORT}/health`);
    });

    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

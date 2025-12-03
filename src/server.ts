/**
 * Express Server Entry Point
 * 
 * Purpose: Initialize and start the Express server
 * 
 * Flow:
 * 1. Load environment variables
 * 2. Connect to database
 * 3. Setup Express app with middleware
 * 4. Setup routes
 * 5. Setup error handlers
 * 6. Start server
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors'; // Handles async errors automatically
import http from 'http';
// Import configurations
import { env } from './shared/config/env.config';
import { connectDatabase } from './shared/config/database.config';
import { initializeFirebase } from './config/firebase'; 
// Import middlewares
import { requestLogger } from './shared/middlewares/logger.middleware';
import { errorHandler, notFoundHandler } from './shared/middlewares/error.middleware';
import { initializeSocketServer } from './socket/socket.server';
import { startTaskReminderScheduler } from './features/task/task.scheduler';
// Import routes
import apiRoutes from './routes';  // ← Add this

/**
 * Initialize Express Application
 */
const app: Application = express();
const httpServer = http.createServer(app);

/**
 * Security Middleware
 * 
 * helmet: Sets various HTTP headers for security
 * - Prevents clickjacking
 * - XSS protection
 * - Content-Type sniffing prevention
 */
app.use(helmet());

/**
 * CORS Configuration
 * 
 * Allows frontend apps to make requests to this API
 */
app.use(cors({
  origin: env.ALLOWED_ORIGINS,
  credentials: true
}));

/**
 * Body Parsers
 * 
 * express.json(): Parse JSON request bodies
 * express.urlencoded(): Parse URL-encoded bodies
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Request Logger
 * 
 * Logs all incoming requests
 */
app.use(requestLogger);

/**
 * Health Check Route
 * 
 * Purpose: Check if server is running
 * Used by monitoring tools
 */
app.get('/health', (_req, res) => {  // ✅ req → _req
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});
// API Routes
app.use('/api', apiRoutes);

app.get('/api', (_req, res) => {  // ✅ req → _req
  res.status(200).json({
    success: true,
    message: 'LifeTrack Pro API',
    version: '1.0.0'
  });
});

/**
 * 404 Handler
 * 
 * This catches all undefined routes
 * Must be after all valid routes
 */
app.use(notFoundHandler);

const io = initializeSocketServer(httpServer);
console.log('✅ Socket.io server initialized')
/**
 * Global Error Handler
 * 
 * Catches all errors thrown in the application
 * Must be the last middleware
 */
app.use(errorHandler);

/**
 * Start Server
 * 
 * 1. Connect to database
 * 2. Start listening on port
 */
const startServer = async (): Promise<void> => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    initializeFirebase(); 
    // ✅ Start task reminder scheduler
    startTaskReminderScheduler();
    //  httpServer.listen(env.PORT, () => {
    //   console.log(`🚀 Server running on port ${env.PORT}`);
    //   console.log(`📡 Socket.io ready for connections`);
    // });
    
    // Start Express server
    app.listen(env.PORT, () => {
      console.log('🚀 Server started successfully');
      console.log(`📡 Listening on port ${env.PORT}`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 API URL: http://localhost:${env.PORT}/api`);
      console.log(`💚 Health: http://localhost:${env.PORT}/health`);
      console.log(`🚀 Server running on port ${env.PORT}`);
      console.log(`📡 Socket.io ready for connections`);
      console.log(`⏰ Task scheduler running`)
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Export app for testing
export default app;
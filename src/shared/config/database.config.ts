/**
 * MongoDB Database Configuration
 * 
 * Purpose: Establish and manage MongoDB connection
 * Features:
 * - Automatic reconnection
 * - Connection pooling
 * - Error handling
 * - Graceful shutdown
 */

import mongoose from 'mongoose';
import { env } from './env.config';

/**
 * MongoDB Connection Options
 * 
 * Explanation:
 * - maxPoolSize: Maximum number of connections in pool (default: 10)
 * - minPoolSize: Minimum connections to maintain
 * - serverSelectionTimeoutMS: Time to wait for server selection
 * - socketTimeoutMS: Socket timeout
 * - family: IP version (4 = IPv4)
 */
const options: mongoose.ConnectOptions = {
  maxPoolSize: 10,      // Maximum 10 concurrent connections
  minPoolSize: 5,       // Always keep 5 connections ready
  serverSelectionTimeoutMS: 5000,  // Timeout after 5 seconds
  socketTimeoutMS: 45000,          // Socket timeout 45 seconds
  family: 4                         // Use IPv4
};

/**
 * Connect to MongoDB
 * 
 * @returns Promise that resolves when connected
 */
export const connectDatabase = async (): Promise<void> => {
  try {
    // Mongoose 6+ doesn't need useNewUrlParser, useUnifiedTopology
    await mongoose.connect(env.MONGODB_URI, options);
    
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.name}`);
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    
    // Exit process if cannot connect to database
    // In production, you might want to retry instead
    process.exit(1);
  }
};

/**
 * Mongoose Connection Event Handlers
 * 
 * Purpose: Monitor database connection status
 */

// Connected event
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB');
});

// Error event
mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

// Disconnected event
mongoose.connection.on('disconnected', () => {
  console.log('📴 Mongoose disconnected from MongoDB');
});

/**
 * Graceful Shutdown
 * 
 * Purpose: Close database connection when app terminates
 * Ensures data integrity and prevents connection leaks
 */
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('👋 MongoDB connection closed due to app termination');
    process.exit(0);
  } catch (error) {
    console.error('Error during database shutdown:', error);
    process.exit(1);
  }
});
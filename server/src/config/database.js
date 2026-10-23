/**
 * Database Configuration
 * 
 * Automatically uses MongoDB Memory Server for development if no
 * system MongoDB is available. This means you can run the server
 * without installing MongoDB on your machine.
 * 
 * In production, set MONGODB_URI to your real MongoDB connection string.
 */

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

let mongoServer = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    // Try connecting to system MongoDB first
    if (uri && process.env.NODE_ENV === 'production') {
      const conn = await mongoose.connect(uri);
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
      return;
    }

    // For development: use MongoDB Memory Server (no installation needed!)
    console.log('⏳ Starting MongoDB Memory Server with persistence...');
    const dbPath = process.cwd() + '/local_db';
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }
    mongoServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'zomato_clone',
        dbPath: dbPath,
        storageEngine: 'wiredTiger'
      }
    });
    uri = mongoServer.getUri();

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Memory Server running at ${uri}`);
    console.log(`   Database: ${conn.connection.name}`);

  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Gracefully stop the in-memory MongoDB server
 */
const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
    console.log('🛑 MongoDB Memory Server stopped');
  }
};

export default connectDB;
export { disconnectDB, mongoServer };

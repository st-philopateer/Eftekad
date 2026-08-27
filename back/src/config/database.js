import mongoose from 'mongoose';
import dns from 'dns';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

// Configure Google DNS to avoid local ISP DNS resolution issues on Windows
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (err) {
  console.warn('DNS server configuration warning:', err.message);
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ghedma_db';
const DB_NAME = process.env.DB_NAME || 'ghedma_db';

export const connectDB = async () => {
  try {
    console.log('🔄 Connecting to MongoDB Atlas via Mongoose...');
    const conn = await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
      maxPoolSize: 50,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 30000,
      connectTimeoutMS: 30000,
    });

    console.log(`🔌 Connected successfully to MongoDB Atlas! Host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Mongoose Connection Error: ${error.message}`);
    // Do not terminate process; allow retry attempts
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB connection lost. Attempting auto-reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB auto-reconnected successfully!');
});

export default connectDB;

import mongoose from 'mongoose';
import connectDB from './src/config/database.js';

async function run() {
  try {
    const conn = await connectDB();
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('COLLECTIONS:', collections.map(c => c.name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

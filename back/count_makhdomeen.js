import mongoose from 'mongoose';
import connectDB from './src/config/database.js';
import Makhdoom from './src/models/Makhdoom.js';

async function run() {
  try {
    await connectDB();
    const count = await Makhdoom.countDocuments({});
    console.log('TOTAL MEMBERS IN DB:', count);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

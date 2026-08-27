import mongoose from 'mongoose';
import connectDB from './src/config/database.js';
import Makhdoom from './src/models/Makhdoom.js';

async function run() {
  try {
    await connectDB();
    const m = await Makhdoom.findOne({ name: 'اندرو نور' });
    console.log('FULL MEMBER DOCUMENT:', JSON.stringify(m, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

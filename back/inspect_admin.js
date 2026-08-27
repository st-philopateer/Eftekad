import mongoose from 'mongoose';
import connectDB from './src/config/database.js';
import User from './src/models/User.js';

async function run() {
  try {
    await connectDB();
    const adminUser = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
    console.log('ADMIN USER:', {
      username: adminUser.username,
      name: adminUser.name,
      church: adminUser.church,
      role: adminUser.role
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

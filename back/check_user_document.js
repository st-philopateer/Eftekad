import connectDB from './src/config/database.js';
import User from './src/models/User.js';

const run = async () => {
  await connectDB();
  const u = await User.findOne({ username: 'اندرو نور' }).lean();
  console.log(u);
  process.exit(0);
};

run();

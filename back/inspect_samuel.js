import connectDB from './src/config/database.js';
import User from './src/models/User.js';

const run = async () => {
  await connectDB();
  // We can search for the user who is "صموئيل صفوت"
  const user = await User.findOne({ username: 'صموئيل صفوت' }).lean();
  console.log('USER DOCUMENT FOR صموئيل صفوت:', JSON.stringify(user, null, 2));
  process.exit(0);
};

run();

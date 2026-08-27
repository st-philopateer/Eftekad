import connectDB from './src/config/database.js';
import Job from './src/models/Job.js';

const run = async () => {
  await connectDB();
  const jobs = await Job.find({}).lean();
  console.log(jobs);
  process.exit(0);
};

run();

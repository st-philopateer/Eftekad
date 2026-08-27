import mongoose from 'mongoose';
import connectDB from './src/config/database.js';
import User from './src/models/User.js';
import Makhdoom from './src/models/Makhdoom.js';

function getCharCodes(str) {
  if (!str) return 'empty';
  return str.split('').map(c => c.charCodeAt(0).toString(16)).join(' ');
}

async function run() {
  try {
    await connectDB();
    
    const u = await User.findOne({ name: 'مينا' });
    const m = await Makhdoom.findOne({ name: 'اندرو نور' });
    
    console.log('USER username:', u.username, 'codes:', getCharCodes(u.username));
    console.log('USER name:', u.name, 'codes:', getCharCodes(u.name));
    console.log('MAKHDOOM assignedServant:', m.assignedServant, 'codes:', getCharCodes(m.assignedServant));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

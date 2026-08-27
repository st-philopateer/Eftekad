import mongoose from 'mongoose';
import connectDB from './src/config/database.js';
import User from './src/models/User.js';
import ServiceTree from './src/models/ServiceTree.js';
import Makhdoom from './src/models/Makhdoom.js';

async function run() {
  try {
    await connectDB();
    
    // 1. Fetch all servant users
    const allUsers = await User.find({});
    const servants = allUsers.filter(u => !['super_admin', 'admin', 'priest'].includes(u.role));
    console.log('ALL SERVANTS IN DB:', servants.map(u => ({ username: u.username, name: u.name, church: u.church })));
    
    // 2. Fetch service tree
    const tree = await ServiceTree.findOne({ name: 'عام' });
    const osra = tree.osras.find(o => o.name === 'تربية كنسية');
    const stage = osra.stages.find(s => s.name === 'تانية ابتدائي');
    const cls = stage.classes.find(c => c.name === 'الانبا بولا والانبا انطونيوس');
    
    console.log('CLASS SERVANTS IN TREE:', cls.servants);
    
    // Calculate classServants like React does
    const classServants = (cls.servants || []).map(u => servants.find(s => s.username === u)).filter(Boolean);
    console.log('RESOLVED CLASS SERVANTS FOR SELECT:', classServants.map(s => ({ username: s.username, name: s.name })));
    
    // 3. Fetch Makhdoom
    const m = await Makhdoom.findOne({ name: 'اندرو نور' });
    console.log('MAKHDOOM assignedServant:', m.assignedServant);
    console.log('DOES IT MATCH ANY CLASS SERVANT?', classServants.some(s => s.username === m.assignedServant));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

import mongoose from 'mongoose';
import connectDB from './src/config/database.js';
import ServiceTree from './src/models/ServiceTree.js';

async function run() {
  try {
    console.log('Starting ghost stages database cleanup...');
    await connectDB();
    const trees = await ServiceTree.find({});
    console.log(`Found ${trees.length} ServiceTrees to clean.`);
    
    for (const tree of trees) {
      if (tree.osras && Array.isArray(tree.osras)) {
        tree.osras = tree.osras.map(osra => {
          osra.stages = [];
          return osra;
        });
        tree.markModified('osras');
        await tree.save();
      }
    }
    console.log('SUCCESS: Reset all service tree stages to [].');
    process.exit(0);
  } catch (err) {
    console.error('ERROR running cleanup script:', err);
    process.exit(1);
  }
}

run();

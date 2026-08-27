import mongoose from 'mongoose';
import connectDB from './src/config/database.js';
import ServiceTree from './src/models/ServiceTree.js';

async function run() {
  try {
    await connectDB();
    const tree = await ServiceTree.findOne({ name: 'عام' });
    if (tree) {
      console.log('FOUND TREE "عام". OSRA NAMES:');
      tree.osras.forEach(o => {
        console.log(`- Osra: ${o.name}, stages count: ${o.stages ? o.stages.length : 0}`);
      });
      
      // Let's modify the osra named "تربية كنسية"
      let found = false;
      tree.osras = tree.osras.map(osra => {
        if (osra.name === 'تربية كنسية') {
          osra.stages = [
            {
              name: 'تانية ابتدائي',
              priestUsers: [],
              familyCoordinatorUsers: [],
              assistantFamilyCoordinatorUsers: [],
              classes: [
                {
                  name: 'الانبا بولا والانبا انطونيوس',
                  servants: ['اسامة', 'مينا']
                }
              ],
              assignments: [],
              generalCoordinatorUsers: []
            }
          ];
          found = true;
          console.log('RESTORED stage in "تربية كنسية"');
        }
        return osra;
      });
      
      if (found) {
        tree.markModified('osras');
        await tree.save();
        console.log('SUCCESS: Saved restored stages back to MongoDB.');
      } else {
        console.log('ERROR: Osra "تربية كنسية" not found in osras list.');
      }
    } else {
      console.log('Tree "عام" not found.');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

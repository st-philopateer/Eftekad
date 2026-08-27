import connectDB from './src/config/database.js';
import Makhdoom from './src/models/Makhdoom.js';

async function run() {
  try {
    await connectDB();
    
    // Find the member
    const m = await Makhdoom.findOne({ name: 'اندرو نور' });
    const targetId = m._id.toString();
    
    // Simulate frontend PUT request
    console.log('Sending PUT to /api/makhdomeen/' + targetId + ' with assignedServant: "مينا"');
    
    const updated = await Makhdoom.findOneAndUpdate(
      { _id: targetId },
      { $set: { assignedServant: 'مينا' } },
      { new: true }
    );
    
    console.log('RESULT OF UPDATE:', JSON.stringify(updated, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();

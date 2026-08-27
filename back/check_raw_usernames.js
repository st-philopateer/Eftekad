import connectDB from './src/config/database.js';
import ServiceTree from './src/models/ServiceTree.js';

const run = async () => {
  await connectDB();
  const tree = await ServiceTree.find({}).lean();
  tree.forEach(srv => {
    (srv.osras || []).forEach(osra => {
      (osra.stages || []).forEach(stage => {
        (stage.assignments || []).forEach(assign => {
          console.log(`Service: ${osra.name}, Stage: ${stage.name}, User in tree: "${assign.username}" (length: ${assign.username.length})`);
        });
      });
    });
  });
  process.exit(0);
};

run();

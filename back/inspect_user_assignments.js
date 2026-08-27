import connectDB from './src/config/database.js';
import User from './src/models/User.js';
import ServiceTree from './src/models/ServiceTree.js';
import Job from './src/models/Job.js';

const run = async () => {
  await connectDB();
  const users = await User.find({}).lean();
  const services = await ServiceTree.find({}).lean();
  const jobs = await Job.find({}).lean();

  console.log('--- JOBS ---');
  jobs.forEach(j => {
    console.log(`Job: ${j.name} (${j.id}) - Perms:`, JSON.stringify(j.permissions));
  });

  console.log('\n--- USERS ---');
  users.forEach(u => {
    console.log(`User: ${u.username} (${u.name}) - Role: ${u.role} - Perms:`, JSON.stringify(u.permissions));
    
    // Find assignments in service tree
    const myAssignments = [];
    services.forEach(srv => {
      (srv.osras || []).forEach(osra => {
        (osra.stages || []).forEach(stage => {
          (stage.assignments || []).forEach(assign => {
            if (assign.username.toLowerCase() === u.username.toLowerCase()) {
              myAssignments.push({
                service: osra.name,
                stage: stage.name,
                jobId: assign.jobId
              });
            }
          });
        });
      });
    });

    if (myAssignments.length > 0) {
      console.log('  Assignments:', myAssignments);
    }
  });

  process.exit(0);
};

run();

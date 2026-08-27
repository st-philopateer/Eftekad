import connectDB from './src/config/database.js';
import User from './src/models/User.js';
import ServiceTree from './src/models/ServiceTree.js';
import Job from './src/models/Job.js';

const getMergedUserPermissions = (user, services, jobs, currentActiveService) => {
  const basePermissions = { ...(user.permissions || {}) };
  const usernameLower = (user.username || '').toLowerCase();
  const activeServiceLower = (currentActiveService || '').toLowerCase();
  
  console.log(`Evaluating for user: ${user.username}, Active Service: ${currentActiveService}`);

  (services || []).forEach(srv => {
    (srv.osras || []).forEach(osra => {
      if (activeServiceLower && osra.name.toLowerCase() !== activeServiceLower) {
        return;
      }
      (osra.stages || []).forEach(stage => {
        (stage.assignments || []).forEach(assign => {
          if ((assign.username || '').toLowerCase() === usernameLower) {
            const job = (jobs || []).find(j => j.id === assign.jobId);
            console.log(`  Found assignment in Stage: ${stage.name}, Job: ${job ? job.name : 'unknown'} (${assign.jobId})`);
            if (job && job.permissions) {
              Object.keys(job.permissions).forEach(k => {
                if (job.permissions[k] === true) {
                  basePermissions[k] = true;
                  console.log(`    Granting perm: ${k} = true`);
                }
              });
            }
          }
        });
      });
    });
  });
  
  return basePermissions;
};

const run = async () => {
  await connectDB();
  const users = await User.find({}).lean();
  const services = await ServiceTree.find({}).lean();
  const jobs = await Job.find({}).lean();

  const andrew = users.find(u => u.username === 'اندرو نور');
  const sam = users.find(u => u.username === 'صموئيل صفوت');

  if (andrew) {
    const perms = getMergedUserPermissions(andrew, services, jobs, 'تربية كنسية');
    console.log('Resulting perms for اندرو نور:', perms);
  }

  if (sam) {
    console.log('\n----------------------------------------\n');
    const perms = getMergedUserPermissions(sam, services, jobs, 'سان فيلوباتير');
    console.log('Resulting perms for صموئيل صفوت:', perms);
  }

  process.exit(0);
};

run();

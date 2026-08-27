import connectDB from './src/config/database.js';
import User from './src/models/User.js';
import ServiceTree from './src/models/ServiceTree.js';
import Job from './src/models/Job.js';

const getMergedUserPermissions = (user, services, jobs, currentActiveService) => {
  const basePermissions = { ...(user.permissions || {}) };
  const usernameLower = (user.username || '').toLowerCase();
  const activeServiceLower = (currentActiveService || '').toLowerCase();
  
  (services || []).forEach(srv => {
    (srv.osras || []).forEach(osra => {
      if (activeServiceLower && osra.name.toLowerCase() !== activeServiceLower) {
        return;
      }
      (osra.stages || []).forEach(stage => {
        (stage.assignments || []).forEach(assign => {
          if ((assign.username || '').toLowerCase() === usernameLower) {
            const job = (jobs || []).find(j => j.id === assign.jobId);
            if (job && job.permissions) {
              Object.keys(job.permissions).forEach(k => {
                if (job.permissions[k] === true) {
                  basePermissions[k] = true;
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
  const user = await User.findOne({ username: 'اندرو نور' }).lean();
  const services = await ServiceTree.find({}).lean();
  const jobs = await Job.find({}).lean();

  const currentActiveSrv = 'تربية كنسية';
  const mergedPerms = getMergedUserPermissions(user, services, jobs, currentActiveSrv);

  console.log('MERGED PERMISSIONS FOR اندرو نور IN تربية كنسية:');
  console.log(JSON.stringify(mergedPerms, null, 2));

  process.exit(0);
};

run();

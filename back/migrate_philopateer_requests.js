import connectDB from './src/config/database.js';
import PhilopateerRequest from './src/models/PhilopateerRequest.js';
import User from './src/models/User.js';
import ServiceTree from './src/models/ServiceTree.js';

const run = async () => {
  await connectDB();
  const requests = await PhilopateerRequest.find({});
  const services = await ServiceTree.find({}).lean();

  console.log(`Found ${requests.length} requests in database. Migrating...`);

  for (const req of requests) {
    const username = req.requesterUsername;
    const user = await User.findOne({ username: new RegExp('^' + username + '$', 'i') }).lean();
    if (!user) continue;

    // Get the base service name currently stored in req.requesterOsra (e.g. "تربية كنسية" or "سان فيلوباتير")
    // We split by " - " just in case it already contains the stage
    const currentOsraBase = req.requesterOsra.split(' - ')[0].trim().toLowerCase();

    let resolvedService = '';
    let resolvedStage = '';

    services.forEach(srv => {
      (srv.osras || []).forEach(osra => {
        // Only match if this service matches the stored service name
        if (osra.name.toLowerCase() !== currentOsraBase) return;

        (osra.stages || []).forEach(stage => {
          const inStage = 
            (stage.generalCoordinatorUsers || []).some(x => x.toLowerCase() === username.toLowerCase()) ||
            (stage.familyCoordinatorUsers || []).some(x => x.toLowerCase() === username.toLowerCase()) ||
            (stage.assistantFamilyCoordinatorUsers || []).some(x => x.toLowerCase() === username.toLowerCase()) ||
            (stage.assignments || []).some(a => (a.username || '').toLowerCase() === username.toLowerCase());
          
          if (inStage) {
            resolvedService = osra.name;
            resolvedStage = stage.name;
          }
        });
      });
    });

    if (resolvedService && resolvedStage) {
      const newOsraValue = `${resolvedService} - ${resolvedStage}`;
      req.requesterOsra = newOsraValue;
      await req.save();
      console.log(`Updated request ${req._id} (${username}) to: ${newOsraValue}`);
    } else {
      console.log(`No matching stage found for ${username} in service ${currentOsraBase}`);
    }
  }

  console.log('Migration finished successfully!');
  process.exit(0);
};

run();

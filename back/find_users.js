import connectDB from './src/config/database.js';
import ServiceTree from './src/models/ServiceTree.js';
import User from './src/models/User.js';

const run = async () => {
  await connectDB();
  const services = await ServiceTree.find({}).lean();
  
  const matches = [];
  services.forEach(srv => {
    (srv.osras || []).forEach(osra => {
      (osra.stages || []).forEach(stage => {
        // Find general coordinator
        const gcList = (stage.generalCoordinatorUsers || []).map(x => x.toLowerCase());
        const fcList = (stage.familyCoordinatorUsers || []).map(x => x.toLowerCase());
        const afcList = (stage.assistantFamilyCoordinatorUsers || []).map(x => x.toLowerCase());
        
        // Custom assignments
        const assignList = (stage.assignments || []).map(a => (a.username || '').toLowerCase());
        
        const allAssigned = [...new Set([...gcList, ...fcList, ...afcList, ...assignList])];
        allAssigned.forEach(username => {
          if (!matches.includes(username)) {
            matches.push(username);
          }
        });
      });
    });
  });

  for (const username of matches) {
    const user = await User.findOne({ username: new RegExp('^' + username + '$', 'i') }).lean();
    if (!user) continue;

    // Check if they are in St. Philopateer and 2nd Grade
    let inPhilopateer = false;
    let inSecondGrade = false;

    services.forEach(srv => {
      (srv.osras || []).forEach(osra => {
        const isPhil = osra.name.toLowerCase().includes('فيلوباتير');
        const isSec = osra.name.toLowerCase().includes('تانية') || osra.name.toLowerCase().includes('ثانية');
        
        (osra.stages || []).forEach(stage => {
          const inStage = 
            (stage.generalCoordinatorUsers || []).some(x => x.toLowerCase() === username.toLowerCase()) ||
            (stage.familyCoordinatorUsers || []).some(x => x.toLowerCase() === username.toLowerCase()) ||
            (stage.assistantFamilyCoordinatorUsers || []).some(x => x.toLowerCase() === username.toLowerCase()) ||
            (stage.assignments || []).some(a => (a.username || '').toLowerCase() === username.toLowerCase());
          
          if (inStage) {
            if (isPhil || stage.name.toLowerCase().includes('فيلوباتير')) inPhilopateer = true;
            if (isSec || stage.name.toLowerCase().includes('تانية') || stage.name.toLowerCase().includes('ثانية')) inSecondGrade = true;
          }
        });
      });
    });

    if (inPhilopateer && inSecondGrade) {
      console.log(`FOUND MATCH: ${user.name} (${user.username})`);
      console.log('USER DOCUMENT:', JSON.stringify(user, null, 2));
    }
  }

  process.exit(0);
};

run();

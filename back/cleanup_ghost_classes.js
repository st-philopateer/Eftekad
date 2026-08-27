const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db();
  
  const services = await db.collection('priestServices').find({}).toArray();
  const makhdomeenCol = db.collection('makhdomeen');
  const makhdomeen = await makhdomeenCol.find({}).toArray();
  
  console.log("=== SCANNING FOR GHOST STAGES & CLASSES ===");
  
  let updateCount = 0;
  for (const member of makhdomeen) {
    if (!member.stage) continue;
    
    // Check if the stage exists in the service tree (any service, any osra)
    let stageObj = null;
    services.forEach(s => {
      (s.osras || []).forEach(o => {
        if (o.stages) {
          const found = o.stages.find(stg => stg.name === member.stage);
          if (found) stageObj = found;
        }
      });
    });
    
    let needsUpdate = false;
    let newStage = member.stage;
    let newFasl = member.fasl;
    
    if (!stageObj) {
      // Stage doesn't exist in service tree at all!
      console.log(`Clearing invalid stage "${member.stage}" for member: ${member.name}`);
      newStage = '';
      newFasl = '';
      needsUpdate = true;
    } else if (member.fasl) {
      // Stage exists, check if the class exists in that stage
      const classExists = (stageObj.classes || []).some(c => c.name === member.fasl);
      if (!classExists) {
        console.log(`Clearing invalid class "${member.fasl}" inside stage "${member.stage}" for member: ${member.name}`);
        newFasl = '';
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      await makhdomeenCol.updateOne(
        { _id: member._id },
        { $set: { stage: newStage, fasl: newFasl } }
      );
      updateCount++;
    }
  }
  
  console.log(`Cleanup finished. Updated ${updateCount} members.`);
  await client.close();
}

main().catch(console.error);

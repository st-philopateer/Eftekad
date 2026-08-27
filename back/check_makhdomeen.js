const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db();
  
  const makhdomeen = await db.collection('makhdomeen').find({}).toArray();
  const stages = {};
  makhdomeen.forEach(m => {
    const key = `${m.stage || '(empty stage)'} - ${m.fasl || '(empty class)'}`;
    stages[key] = (stages[key] || 0) + 1;
  });
  console.log("=== MAKHDOMEEN STAGE/CLASS DISTRIBUTION ===");
  console.log(stages);
  
  await client.close();
}

main().catch(console.error);

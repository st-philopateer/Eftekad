const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db();
  
  const users = await db.collection('users').find({}).toArray();
  console.log("=== USERS WITH ASSIGNMENTS ===");
  users.forEach(u => {
    const hasAss = Object.keys(u).some(k => ['osra', 'stage', 'fasl', 'class', 'service'].includes(k) && u[k] !== null && u[k] !== '');
    if (hasAss) {
      console.log(`User: ${u.username} (${u.name}), role: ${u.role}`);
      ['osra', 'stage', 'fasl', 'class', 'service'].forEach(k => {
        if (u[k]) console.log(`  - ${k}: ${JSON.stringify(u[k])}`);
      });
    }
  });
  
  await client.close();
}

main().catch(console.error);

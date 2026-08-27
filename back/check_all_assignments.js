const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db();
  
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    const name = col.name;
    const docs = await db.collection(name).find({}).toArray();
    docs.forEach(doc => {
      const str = JSON.stringify(doc);
      if (str.includes("باجوش")) {
        console.log(`Match in collection "${name}":`);
        console.log(JSON.stringify(doc, null, 2));
        console.log("-----------------------------------------");
      }
    });
  }
  
  await client.close();
}

main().catch(console.error);

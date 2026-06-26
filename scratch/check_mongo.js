const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not defined in .env");
  process.exit(1);
}

async function run() {
  const client = new MongoClient(uri);
  try {
    console.log("Connecting to MongoDB Atlas...");
    await client.connect();
    console.log("Connected successfully!");
    
    const dbName = "ghedma_db"; 
    const db = client.db(dbName);
    
    const collections = await db.listCollections().toArray();
    console.log("Collections in database:", collections.map(c => c.name));
    
    for (const colInfo of collections) {
      const colName = colInfo.name;
      const count = await db.collection(colName).countDocuments();
      console.log(`Collection '${colName}': ${count} documents`);
      if (count > 0) {
        const samples = await db.collection(colName).find().limit(2).toArray();
        console.log(`Sample from '${colName}':`, JSON.stringify(samples, null, 2));
      }
    }
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  } finally {
    await client.close();
  }
}

run();

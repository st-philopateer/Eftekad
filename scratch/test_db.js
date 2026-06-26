const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'ghedma_db';
const COLLECTION_NAME = 'system_store';

async function test() {
  if (!MONGODB_URI) {
    console.log("No MONGODB_URI found in env.");
    return;
  }
  console.log("Connecting to:", MONGODB_URI);
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    console.log("Connected successfully!");
    const db = client.db(DB_NAME);
    const doc = await db.collection(COLLECTION_NAME).findOne({ _id: 'state' });
    if (doc) {
      console.log("Found state document. Keys in data:", Object.keys(doc.data));
      console.log("Number of priests:", doc.data.priests?.length);
      console.log("Number of servants:", doc.data.servants?.length);
      if (doc.data.priests) {
        doc.data.priests.forEach(p => {
          console.log(`Priest: ${p.username}, profilePic exists: ${!!p.profilePic}, profilePic len: ${p.profilePic ? p.profilePic.length : 0}`);
        });
      }
    } else {
      console.log("State document not found in collection.");
    }
  } catch (e) {
    console.error("Error connecting to MongoDB:", e);
  } finally {
    await client.close();
  }
}

test();

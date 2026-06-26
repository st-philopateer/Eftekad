const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    const db = client.db('ghedma_db');
    const col = db.collection('system_store');
    const doc = await col.findOne({ _id: 'state' });
    if (doc && doc.data) {
      console.log("Priests in DB:");
      console.log(doc.data.priests.map(p => ({ name: p.name, username: p.username, email: p.email, password: p.password })));
    } else {
      console.log("No state document found in database.");
    }
  } finally {
    await client.close();
  }
}
run().catch(console.dir);

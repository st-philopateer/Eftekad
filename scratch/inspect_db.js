const { MongoClient } = require('mongodb');
const uri = "mongodb+srv://andrewnour16_db_user:GZbjFoMbiO5otLJK@cluster0.az5hqhg.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
    const db = client.db('ghedma_db');
    const collection = db.collection('system_store');
    const doc = await collection.findOne({ _id: 'state' });
    if (doc && doc.data) {
      console.log("Deadlines in MongoDB:", JSON.stringify(doc.data.deadlines, null, 2));
    } else {
      console.log("No state document or data found.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}
run();

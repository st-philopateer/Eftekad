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
      let priests = doc.data.priests || [];
      
      // Check if ابونا ميخائيل is already in the database
      const hasMikha = priests.some(p => p.username === 'ابونا ميخائيل');
      if (!hasMikha) {
        priests.push({
          church: "كنيسة مارجرجس",
          name: "ابونا ميخائيل",
          email: "andrewnour9@gmail.com",
          username: "ابونا ميخائيل",
          password: "123456",
          profilePic: null
        });
        console.log("Adding ابونا ميخائيل back to database...");
      } else {
        console.log("ابونا ميخائيل already exists in database.");
      }

      // Check if ابونا كاراس is in the database
      const hasKaras = priests.some(p => p.username === 'ابونا كاراس');
      if (!hasKaras) {
        priests.push({
          church: "كنيسة مارجرجس",
          name: "ابونا كاراس",
          email: "samuelsafwat700@gmail.com",
          username: "ابونا كاراس",
          password: "123456789",
          profilePic: null
        });
        console.log("Adding ابونا كاراس back to database...");
      }

      doc.data.priests = priests;
      
      await col.updateOne({ _id: 'state' }, { $set: { data: doc.data } });
      console.log("Database updated successfully!");
    } else {
      console.log("No state document found in database.");
    }
  } finally {
    await client.close();
  }
}
run().catch(console.dir);

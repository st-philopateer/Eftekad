const http = require('http');

http.get('http://localhost:3000/api/sync', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const db = JSON.parse(data);
      console.log("=== DB KEYS ===");
      console.log(Object.keys(db));
      console.log("=== DEADLINES ===");
      console.log(JSON.stringify(db.deadlines, null, 2));
      console.log("=== VERSIONS ===");
      console.log(JSON.stringify(db._versions, null, 2));
    } catch (e) {
      console.error("Failed to parse DB:", e);
    }
  });
}).on('error', (err) => {
  console.error("Request failed:", err);
});

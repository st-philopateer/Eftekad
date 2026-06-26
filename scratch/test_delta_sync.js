const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => resolve(JSON.parse(responseBody)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => resolve(JSON.parse(responseBody)));
    }).on('error', reject);
  });
}

async function runTest() {
  try {
    console.log("1. Setting initial state with one deadline...");
    const initialDeadlines = {
      "test_priest": [
        { id: 1001, scope: "all", datetime: "2026-06-25T12:00", applied: false }
      ]
    };
    await post('/api/sync', { key: 'deadlines', data: initialDeadlines });

    let current = await get('/api/sync');
    console.log("Current server deadlines:", JSON.stringify(current.deadlines));

    console.log("\n2. Priest deletes deadline 1001 (sends empty next)...");
    const deleteRes = await post('/api/sync/delta', {
      key: 'deadlines',
      prev: { "test_priest": [{ id: 1001, scope: "all", datetime: "2026-06-25T12:00", applied: false }] },
      next: { "test_priest": [] }
    });
    console.log("Delete response success:", deleteRes.success, "Merged:", JSON.stringify(deleteRes.merged));

    console.log("\n3. Servant syncs with old state (contains 1001)...");
    const servantSyncRes = await post('/api/sync/delta', {
      key: 'deadlines',
      prev: { "test_priest": [{ id: 1001, scope: "all", datetime: "2026-06-25T12:00", applied: false }] },
      next: { "test_priest": [{ id: 1001, scope: "all", datetime: "2026-06-25T12:00", applied: false }] }
    });
    console.log("Servant sync response success:", servantSyncRes.success, "Merged:", JSON.stringify(servantSyncRes.merged));

    console.log("\n4. Verification: Merged deadlines should remain empty...");
    if (servantSyncRes.merged["test_priest"].length === 0) {
      console.log("✅ Success! The deleted deadline did NOT reappear.");
    } else {
      console.log("❌ Failure: The deleted deadline was restored!");
    }
  } catch (e) {
    console.error("Test failed with error:", e);
  }
}

runTest();

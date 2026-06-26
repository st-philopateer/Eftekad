const http = require('http');

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  try {
    console.log("1. Fetching current db...");
    let res = await request({ hostname: 'localhost', port: 3000, path: '/api/sync', method: 'GET' });
    const currentDeadlines = res.body.deadlines || {};
    console.log("Current deadlines:", JSON.stringify(currentDeadlines));

    console.log("\n2. Adding deadline 9999 for 'ابونا ميخائيل'...");
    const addedDeadlines = JSON.parse(JSON.stringify(currentDeadlines));
    addedDeadlines["ابونا ميخائيل"] = [
      { id: 9999, scope: "all", scopeValue: "", datetime: "2026-06-30T12:00", applied: false }
    ];

    res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/sync/delta',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      key: 'deadlines',
      prev: currentDeadlines,
      next: addedDeadlines
    });
    console.log("Add response status:", res.status);
    console.log("Add response body:", JSON.stringify(res.body));

    console.log("\n3. Fetching db after add...");
    res = await request({ hostname: 'localhost', port: 3000, path: '/api/sync', method: 'GET' });
    console.log("Db deadlines after add:", JSON.stringify(res.body.deadlines));

    console.log("\n4. Deleting deadline 9999 for 'ابونا ميخائيل'...");
    const deletedDeadlines = JSON.parse(JSON.stringify(res.body.deadlines));
    deletedDeadlines["ابونا ميخائيل"] = [];

    res = await request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/sync/delta',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      key: 'deadlines',
      prev: res.body.deadlines,
      next: deletedDeadlines
    });
    console.log("Delete response status:", res.status);
    console.log("Delete response body:", JSON.stringify(res.body));

    console.log("\n5. Fetching db after delete...");
    res = await request({ hostname: 'localhost', port: 3000, path: '/api/sync', method: 'GET' });
    console.log("Db deadlines after delete:", JSON.stringify(res.body.deadlines));

  } catch (err) {
    console.error("Test failed:", err);
  }
}

run();

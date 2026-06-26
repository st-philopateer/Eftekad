const http = require('http');
const app = require('../api/server');
require('dotenv').config();

const PORT = 4567;

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer(app);
    server.listen(PORT, () => {
      console.log(`Test server listening on port ${PORT}`);
      resolve(server);
    });
  });
}

async function runTest() {
  const server = await startServer();
  
  // Create a dummy base64 string
  const dummyBase64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";
  
  // Let's fetch current state first to get initial priests
  console.log("Fetching initial state...");
  const initRes = await fetch(`http://localhost:${PORT}/api/sync`);
  const initData = await initRes.json();
  const initialPriests = initData.priests || [];
  
  // Let's construct next state
  const nextPriests = JSON.parse(JSON.stringify(initialPriests));
  const usernameToTest = "samuel safwat";
  let me = nextPriests.find(p => p.username === usernameToTest);
  if (!me) {
    // If samuel safwat doesn't exist, create him
    me = {
      username: usernameToTest,
      name: "سامح صفوت",
      email: "samuel@example.com",
      password: "123"
    };
    nextPriests.push(me);
  }
  // Update his profilePic
  me.profilePic = dummyBase64;

  console.log("Sending /api/sync/delta for priests...");
  const deltaRes = await fetch(`http://localhost:${PORT}/api/sync/delta`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: 'priests',
      prev: initialPriests,
      next: nextPriests
    })
  });
  
  const deltaData = await deltaRes.json();
  console.log("Delta response status:", deltaRes.status);
  console.log("Delta response body success:", deltaData.success);
  
  // Now fetch from /api/sync again
  console.log("Fetching /api/sync to verify...");
  const syncRes = await fetch(`http://localhost:${PORT}/api/sync`);
  const syncData = await syncRes.json();
  
  const savedPriests = syncData.priests || [];
  const found = savedPriests.find(p => p.username === usernameToTest);
  if (found) {
    console.log("Saved priest profilePic exists:", !!found.profilePic);
    console.log("Saved priest profilePic length:", found.profilePic ? found.profilePic.length : 0);
    console.log("Match initial:", found.profilePic === dummyBase64);
  } else {
    console.log("Priest not found in sync response!");
  }
  
  // Clean up: Let's remove the test profilePic (restore it to original state)
  console.log("Cleaning up test data...");
  const cleanupPriests = JSON.parse(JSON.stringify(syncData.priests));
  let cleanupMe = cleanupPriests.find(p => p.username === usernameToTest);
  if (cleanupMe) {
    cleanupMe.profilePic = null;
    await fetch(`http://localhost:${PORT}/api/sync/delta`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'priests',
        prev: syncData.priests,
        next: cleanupPriests
      })
    });
  }
  
  server.close(() => {
    console.log("Test server closed.");
    process.exit(0);
  });
}

runTest().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});

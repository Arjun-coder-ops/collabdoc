require('dotenv').config();
const { runUser } = require('../../tests/load/socket-test');
const mongoose = require('mongoose');
const Document = require('../../src/models/Document');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// FORCE local database for load testing to prevent hitting production
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const MONGO_URI = 'mongodb://127.0.0.1:27017/collabdoc_test';
const USERS = 15; // smaller for local testing, e.g. 15
const DURATION_MS = 60000; // 1 min for quick local validation

async function run() {
  console.log(`Starting soak test with ${USERS} users for ${DURATION_MS / 1000} seconds...`);
  await mongoose.connect(MONGO_URI);
  
  const doc = await Document.create({
    title: 'Soak Test Doc',
    owner: new mongoose.Types.ObjectId(),
    isPublic: true,
    content: '',
  });

  const promises = [];
  // Each user sends an update every 100ms. So in 60s, a user sends 600 updates.
  const updatesPerUser = Math.floor(DURATION_MS / 100);

  const metricsBefore = (await axios.get(`${BASE_URL}/api/metrics`)).data;
  const start = Date.now();

  for (let i = 0; i < USERS; i++) {
    promises.push(runUser(BASE_URL, doc._id.toString(), doc.shareToken, updatesPerUser));
  }

  const outcomes = await Promise.allSettled(promises);
  const metricsAfter = (await axios.get(`${BASE_URL}/api/metrics`)).data;

  let successCount = 0, failCount = 0;
  outcomes.forEach(o => {
    if (o.status === 'fulfilled' && o.value && o.value.success) successCount++;
    else failCount++;
  });

  const summary = {
    durationMs: Date.now() - start,
    users: USERS,
    successCount,
    failCount,
    errorRate: ((failCount / USERS) * 100).toFixed(2),
    metricsDelta: {
      socketUpdates: metricsAfter.socket.updateEvents - metricsBefore.socket.updateEvents,
      dbWrites: metricsAfter.db.savesExecuted - metricsBefore.db.savesExecuted,
    },
    finalMemoryState: {
      activeDocuments: metricsAfter.documents.activeCount,
      activeConnections: metricsAfter.socket.activeConnections
    }
  };

  const resultsPath = path.join(__dirname, '../../tests/results/soak-test.json');
  fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
  fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2));

  console.log('\n=== Soak Test Summary ===');
  console.log(summary);

  await Document.findByIdAndDelete(doc._id);
  await mongoose.disconnect();
}

run().catch(console.error);

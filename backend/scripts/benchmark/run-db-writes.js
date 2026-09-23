require('dotenv').config();
const { runUser } = require('../../tests/load/socket-test');
const mongoose = require('mongoose');
const Document = require('../../src/models/Document');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { spawn } = require('child_process');

// FORCE local database for load testing to prevent hitting production
const MONGO_URI = 'mongodb://127.0.0.1:27017/collabdoc_test';
const PORT = 5001; // Use a different port for standalone test server
const BASE_URL = `http://localhost:${PORT}`;

async function runTestMode(disableDebounce) {
  console.log(`\n=== Running with DISABLE_DEBOUNCE=${disableDebounce} ===`);
  
  // Start server
  const env = Object.assign({}, process.env, { PORT, DISABLE_DEBOUNCE: disableDebounce, MONGO_URI });
  const server = spawn('node', ['src/index.js'], { env, cwd: path.join(__dirname, '../../') });
  
  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  const doc = await Document.create({
    title: 'DB Write Test Doc',
    owner: new mongoose.Types.ObjectId(),
    isPublic: true,
    content: '',
  });

  const users = 5; // 5 users editing same document
  const updatesPerUser = 50; // Each sends 50 updates rapidly

  const metricsBefore = (await axios.get(`${BASE_URL}/api/metrics`)).data;

  const promises = [];
  for (let i = 0; i < users; i++) {
    promises.push(runUser(BASE_URL, doc._id.toString(), doc.shareToken, updatesPerUser));
  }

  await Promise.allSettled(promises);

  // Wait a moment for debounced saves to flush
  await new Promise(r => setTimeout(r, 2500));

  const metricsAfter = (await axios.get(`${BASE_URL}/api/metrics`)).data;
  
  const clientUpdates = users * updatesPerUser;
  const dbWrites = metricsAfter.db.savesExecuted - metricsBefore.db.savesExecuted;
  
  console.log(`Mode: ${disableDebounce === 'true' ? 'No Debounce' : '2s Debounce'}`);
  console.log(`Total Editor Updates: ${clientUpdates}`);
  console.log(`Total DB Writes: ${dbWrites}`);

  // Cleanup
  await Document.findByIdAndDelete(doc._id);
  
  // Kill server
  server.kill();
  await new Promise(resolve => server.on('close', resolve));

  return { clientUpdates, dbWrites };
}

async function run() {
  await mongoose.connect(MONGO_URI);

  const noDebounceStats = await runTestMode('true');
  const debounceStats = await runTestMode('false');

  const reduction = ((noDebounceStats.dbWrites - debounceStats.dbWrites) / noDebounceStats.dbWrites) * 100;

  const results = {
    baseline: noDebounceStats,
    debounced: debounceStats,
    reductionPercentage: reduction.toFixed(2)
  };

  const resultsPath = path.join(__dirname, '../../tests/results/db-writes.json');
  fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== DB Write Benchmark Results ===');
  console.log(`Without debounce: ${noDebounceStats.dbWrites} DB writes`);
  console.log(`With 2-second debounce: ${debounceStats.dbWrites} DB writes`);
  console.log(`Measured reduction: ${results.reductionPercentage}%`);

  await mongoose.disconnect();
}

run().catch(console.error);

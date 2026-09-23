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

async function run() {
  await mongoose.connect(MONGO_URI);
  
  // Create test document
  const doc = await Document.create({
    title: 'Load Test Doc',
    owner: new mongoose.Types.ObjectId(), // Fake owner
    isPublic: true,
    content: '',
  });

  const levels = [10, 20, 30, 40, 50]; // Find exact threshold
  const results = [];

  for (const users of levels) {
    console.log(`\nStarting test with ${users} concurrent users...`);
    
    // Reset metrics endpoint (we can just fetch before and after and calculate delta, 
    // or wait, we restart server? No, just diff metrics)
    const metricsBefore = (await axios.get(`${BASE_URL}/api/metrics`)).data;

    const promises = [];
    for (let i = 0; i < users; i++) {
      promises.push(runUser(BASE_URL, doc._id.toString(), doc.shareToken, 20)); // 20 updates per user
    }

    const start = Date.now();
    const outcomes = await Promise.allSettled(promises);
    const duration = Date.now() - start;

    const metricsAfter = (await axios.get(`${BASE_URL}/api/metrics`)).data;

    let successCount = 0;
    let failCount = 0;
    const failReasons = {};
    outcomes.forEach(o => {
      if (o.status === 'fulfilled' && o.value && o.value.success) {
        successCount++;
      } else {
        failCount++;
        const reason = o.value ? o.value.reason : (o.reason ? o.reason.message : 'unknown');
        failReasons[reason] = (failReasons[reason] || 0) + 1;
      }
    });

    const errorRate = (failCount / users) * 100;
    const socketMetrics = metricsAfter.socket;
    
    const result = {
      users,
      successCount,
      failCount,
      failReasons,
      errorRate: errorRate.toFixed(2),
      durationMs: duration,
      p50: socketMetrics.joinLatenciesMs.p50,
      p95: socketMetrics.joinLatenciesMs.p95,
      p99: socketMetrics.joinLatenciesMs.p99,
      requestsEvents: metricsAfter.socket.updateEvents - metricsBefore.socket.updateEvents
    };
    
    console.log(`Result: ${successCount} succeeded, ${failCount} failed. Error Rate: ${result.errorRate}%`);
    if (failCount > 0) console.log('Fail reasons:', failReasons);
    console.log(`p95 Join Latency: ${result.p95}ms`);
    results.push(result);

    if (errorRate > 5 || result.p95 > 2000) {
      console.log('Threshold exceeded, stopping scale-up.');
      break;
    }

    // Cooldown
    await new Promise(r => setTimeout(r, 2000));
  }

  // Cleanup
  await Document.findByIdAndDelete(doc._id);
  await mongoose.disconnect();

  const resultsPath = path.join(__dirname, '../../tests/results/concurrency.json');
  fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${resultsPath}`);
}

run().catch(console.error);

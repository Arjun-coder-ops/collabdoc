const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const DURATION_MS = parseInt(process.env.DURATION || 30000); // Default 30s for quick test
const INTERVAL_MS = 2000;

async function run() {
  console.log(`Starting availability monitor for ${DURATION_MS}ms...`);
  const startTime = Date.now();
  let totalChecks = 0;
  let successfulChecks = 0;
  let failedChecks = 0;
  const latencies = [];
  
  const results = [];

  while (Date.now() - startTime < DURATION_MS) {
    totalChecks++;
    const checkStart = Date.now();
    try {
      const res = await axios.get(`${BASE_URL}/api/health`, { timeout: 1500 });
      const latency = Date.now() - checkStart;
      if (res.status === 200 && res.data.status === 'ok') {
        successfulChecks++;
        latencies.push(latency);
        results.push({ timestamp: new Date(), status: 200, latency, healthy: true });
      } else {
        throw new Error(`Unexpected status: ${res.status}`);
      }
    } catch (e) {
      failedChecks++;
      results.push({ timestamp: new Date(), status: e.response ? e.response.status : 0, latency: 0, healthy: false, reason: e.message });
      console.log(`[!] Health check failed: ${e.message}`);
    }

    await new Promise(r => setTimeout(r, INTERVAL_MS));
  }

  const availability = (successfulChecks / totalChecks) * 100;
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
  const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)] || 0;

  const summary = {
    observationWindowMs: DURATION_MS,
    totalChecks,
    successfulChecks,
    failedChecks,
    availabilityPercentage: availability.toFixed(2),
    averageLatencyMs: avgLatency.toFixed(2),
    p95LatencyMs: p95Latency
  };

  const resultsPath = path.join(__dirname, '../../tests/results/availability.json');
  fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
  fs.writeFileSync(resultsPath, JSON.stringify({ summary, details: results }, null, 2));

  console.log('\n=== Availability Report ===');
  console.log(summary);
}

run().catch(console.error);

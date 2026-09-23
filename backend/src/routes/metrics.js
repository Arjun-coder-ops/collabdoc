const express = require('express');
const metrics = require('../utils/metrics');

const router = express.Router();

router.get('/', (req, res) => {
  // To keep this test-only or protected, we can check an env var or a simple secret if needed, 
  // but for local load testing as requested, we just expose it. 
  // We make sure it doesn't return sensitive data (JWTs, user data, document contents).
  const report = metrics.getReport();
  res.json(report);
});

module.exports = router;

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { setupSocket } = require('./socket');
const metrics = require('./utils/metrics');

const authRoutes = require('./routes/auth');
const docRoutes = require('./routes/documents');
const metricsRoutes = require('./routes/metrics');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// HTTP Instrumentation Middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    metrics.recordHttpRequest(duration, isError);
  });
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);
app.use('/api/metrics', metricsRoutes);

app.get('/', (req, res) => res.send('CollabDoc API is running safely!'));

app.get('/api/health', (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  if (!isMongoConnected) {
    return res.status(503).json({
      status: 'error',
      message: 'MongoDB disconnected',
      timestamp: new Date().toISOString(),
    });
  }

  res.json({ 
    status: 'ok',
    uptimeSeconds: process.uptime(),
    mongoConnected: isMongoConnected,
    timestamp: new Date().toISOString(),
    activeConnections: metrics.socket.activeConnections
  });
});

setupSocket(server);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));

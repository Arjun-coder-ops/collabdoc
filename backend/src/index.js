require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const { setupSocket } = require('./socket');

const authRoutes = require('./routes/auth');
const docRoutes = require('./routes/documents');

const app = express();
const server = http.createServer(app);

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/documents', docRoutes);

app.get('/', (req, res) => res.send('CollabDoc API is running safely!'));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

setupSocket(server);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error('MongoDB connection error:', err));

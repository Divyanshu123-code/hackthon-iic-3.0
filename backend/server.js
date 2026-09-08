const express = require('express');
const cors = require('cors');
const path = require('path');
const { mandiEvents } = require('./data/db');

const farmerRoutes = require('./routes/farmer');
const scheduleRoutes = require('./routes/schedule');
const queueRoutes = require('./routes/queue');
const paymentRoutes = require('./routes/payment');
const sathiRoutes = require('./routes/sathi');
const staffRoutes = require('./routes/staff');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files (Stitch UI & Staff Portal)
app.use(express.static(path.join(__dirname, 'public')));

// Server-Sent Events (SSE) live push stream
app.get('/api/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial connected ping
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Stream Connected' })}\n\n`);

  const onChange = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  mandiEvents.on('change', onChange);

  req.on('close', () => {
    mandiEvents.off('change', onChange);
  });
});

// API Routes
app.use('/api/farmer', farmerRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/sathi', sathiRoutes);
app.use('/api/staff', staffRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Kisan Mandi API',
    features: ['Multi-Farmer Queue Engine', 'Bilingual Sathi AI', 'Instant 80% Advance', 'SSE Live Stream'],
    timestamp: new Date().toISOString()
  });
});

// Staff portal shortcut route
app.get('/staff', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'staff.html'));
});

// Fallback to index.html for SPA navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌾 Kisan Mandi API Server is running on port ${PORT}`);
  console.log(`📱 Farmer App (Stitch UI):  http://localhost:${PORT}`);
  console.log(`🛠️  Staff Control Desk:     http://localhost:${PORT}/staff`);
  console.log(`⚡ Live SSE Stream:         http://localhost:${PORT}/api/stream`);
  console.log(`📋 API Health Check:        http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

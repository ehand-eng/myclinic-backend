
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { requestLogger } = require('./utils/logger');
require('dotenv').config();

// Import routes
const doctorRoutes = require('./routes/doctorRoutes');
const dispensaryRoutes = require('./routes/dispensaryRoutes');
const authRoutes = require('./routes/authRoutes');
const customAuthRoutes = require('./routes/customAuthRoutes');
const mobileAuthRoutes = require('./routes/mobileAuthRoutes');
const adminRoutes = require('./routes/adminRoutes');
const timeSlotRoutes = require('./routes/timeSlotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reportRoutes = require('./routes/reportRoutes');
const userDispensary = require('./routes/userDispensaryRoutes');
const userRoutes = require('./routes/userRoutes');
const doctorDispensaryRoutes = require('./routes/doctorDispensaryRoutes');
const cleanFeeRoutes = require('./routes/cleanFeeRoutes');
const feeManagementRoutes = require('./routes/feeManagementRoutes');
const channelPartnerRoutes = require('./routes/channelPartnerRoutes');
const fcmRoutes = require('./routes/fcmRoutes');
const dispensaryCheckInRoutes = require('./routes/dispensaryCheckInRoutes');
const utilRoutes = require('./routes/utilRoutes');
const locationRoutes = require('./routes/locationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware (replace the simple console.log)
app.use(requestLogger);

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor-reservation')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Routes
app.use('/api/doctors', doctorRoutes);
app.use('/api/dispensaries', dispensaryRoutes);
app.use('/api/fcm-token', fcmRoutes);
// app.use('/api/auth', authRoutes); // Keep for backward compatibility during migration
// app.use('/api/auth', customAuthRoutes);
app.use('/api/custom-auth', customAuthRoutes); // New custom authentication
app.use('/api/mobile/auth', mobileAuthRoutes); // Mobile authentication routes
app.use('/api/admin', adminRoutes); // New admin routes
app.use('/api/timeslots', timeSlotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/user-dispensary', userDispensary);
app.use('/api/users', userRoutes);
app.use('/api/doctor-dispensaries', doctorDispensaryRoutes);
// app.use('/api', cleanFeeRoutes); // Clean fee management routes
app.use('/api/fees', feeManagementRoutes); // Fixed fee management routes with real DB
app.use('/api/channel-partners', channelPartnerRoutes); // Channel partner routes
app.use('/api/dispensary', dispensaryCheckInRoutes); // Dispensary check-in routes
app.use('/api/util', utilRoutes); // Utility routes (OTP management)
app.use('/api/location', locationRoutes); // Location-based search routes
app.use('/api/payment', paymentRoutes); // Payment Gateway Routes

// Base route
app.get('/api', (req, res) => {
  res.send('Doctor Reservation API is running');
});

// Start server
// Create HTTP server and integrate Socket.io
// Create HTTP server and integrate WebSocket (ws)
const http = require('http');
const WebSocket = require('ws');
const url = require('url');

const httpServer = http.createServer(app);

// Create WebSocket Server attached to the HTTP server
// We handle the 'upgrade' event manually to support the /ws path strictly if needed,
// or just pass { server: httpServer, path: '/ws' }
const wss = new WebSocket.Server({ server: httpServer, path: '/ws' });

// Store clients and their subscriptions
// structure: Map<WebSocket, { dispensaryId: string, doctorId: string }>
const clients = new Map();

wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      if (data.type === 'SUBSCRIBE_APPOINTMENT') {
        const { dispensaryId, doctorId } = data.payload || {};

        if (dispensaryId) {
          // Save subscription details for this client
          clients.set(ws, { dispensaryId, doctorId });
          console.log(`Client subscribed to dispensary: ${dispensaryId}, doctor: ${doctorId || 'all'}`);

          // Optional: Send immediate confirmation or current status if you had it easily accessible
          ws.send(JSON.stringify({
            type: 'SUBSCRIPTION_SUCCESS',
            payload: { dispensaryId, doctorId }
          }));
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Helper function to broadcast updates
wss.broadcastToRoom = (dispensaryId, doctorId, data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      const subscription = clients.get(client);
      if (subscription && subscription.dispensaryId === dispensaryId.toString()) {
        // If the update is for a specific doctor, only send to those subscribed to that doctor OR all doctors
        if (!subscription.doctorId || subscription.doctorId === doctorId.toString()) {
          client.send(JSON.stringify(data));
        }
      }
    }
  });
};

// Make wss accessible in routes
app.set('wss', wss);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

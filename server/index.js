
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
// app.use('/api/auth', authRoutes); // Keep for backward compatibility during migration
app.use('/api/auth', customAuthRoutes);
app.use('/api/custom-auth', customAuthRoutes); // New custom authentication
app.use('/api/auth', mobileAuthRoutes); // Mobile authentication routes
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

// Base route
app.get('/api', (req, res) => {
  res.send('Doctor Reservation API is running');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

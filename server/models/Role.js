const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ['super-admin', 'dispensary-admin', 'dispensary-staff', 'doctor', 'channel-partner']
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  permissions: [{
    type: String,
    enum: [
      'manage:users',
      'manage:roles', 
      'manage:dispensaries',
      'manage:doctors',
      'manage:fees',
      'view:reports',
      'manage:timeslots',
      'create:bookings',
      'view:bookings',
      'update:bookings',
      'view:own-reports'
    ]
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Role', roleSchema);
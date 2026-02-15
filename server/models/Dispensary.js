
const mongoose = require('mongoose');

const dispensarySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: false
  },
  description: String,
  doctors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  }],
  location: {
    latitude: Number,
    longitude: Number
  },
  bookingVisibleDays: {
    type: Number,
    default: 30,
    min: 1
  }
}, {
  timestamps: {
    createdAt: true,
    updatedAt: true
  }
});

module.exports = mongoose.model('Dispensary', dispensarySchema);

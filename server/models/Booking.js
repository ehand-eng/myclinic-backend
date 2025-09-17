const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  dispensaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dispensary',
    required: true
  },
  bookingDate: {
    type: Date,
    required: true
  },
  timeSlot: {
    type: String,
    required: true
  },
  appointmentNumber: {
    type: Number,
    required: true
  },
  estimatedTime: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'checked_in', 'completed', 'cancelled', 'no_show'],
    default: 'scheduled'
  },
  notes: {
    type: String
  },
  symptoms: {
    type: String
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  isPatientVisited: {
    type: Boolean,
    default: false
  },
  checkedInTime: {
    type: Date
  },
  completedTime: {
    type: Date
  },
  patientName: {
    type: String,
    required: true
  },
  patientPhone: {
    type: String,
    required: true
  },
  patientEmail: {
    type: String
  },
  fees: {
    doctorFee: { type: Number, default: 0 },
    dispensaryFee: { type: Number, default: 0 },
    channelPartnerFee: { type: Number, default: 0 },
    bookingCommission: { type: Number, default: 0 },
    totalFee: { type: Number, default: 0 }
  },
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  bookedUser: {
    type: String,
    default: 'online'
  },
  bookedBy: {
    type: String,
    enum: ['ONLINE', 'DISPENSARY-ADMIN', 'DISPENSARY-STAFF', 'SUPER-ADMIN', 'CHANNEL-PARTNER'],
    default: 'ONLINE'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate unique transaction ID before saving
bookingSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.transactionId = `TRX-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);

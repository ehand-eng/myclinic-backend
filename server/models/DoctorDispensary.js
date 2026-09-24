const mongoose = require('mongoose');

const doctorDispensarySchema = new mongoose.Schema({
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor'
  },
  dispensaryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dispensary',
    required: true
  },
  bookingCode: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true,
    match: /^[A-Z][0-9]{3}$/
  },
  doctorFee: {
    type: Number,
    default: 0
  },
  dispensaryFee: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  bookingVisibleDays: {
    type: Number,
    description: 'Number of days into the future patients can book. Overrides dispensary default.'
  }
}, {
  timestamps: true
});

// Create a compound index to ensure unique doctor-dispensary combinations
doctorDispensarySchema.index({ doctorId: 1, dispensaryId: 1 }, { unique: true });

const DoctorDispensary = mongoose.model('DoctorDispensary', doctorDispensarySchema);

module.exports = DoctorDispensary;

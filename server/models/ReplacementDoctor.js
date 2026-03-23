const mongoose = require('mongoose');

const replacementDoctorSchema = new mongoose.Schema({
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
  replacementName: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  reason: {
    type: String
  }
}, {
  timestamps: {
    createdAt: true,
    updatedAt: true
  }
});

// Only one active replacement per doctor-dispensary at a time (no overlapping date ranges)
replacementDoctorSchema.index({ doctorId: 1, dispensaryId: 1, startDate: 1, endDate: 1 });

module.exports = mongoose.model('ReplacementDoctor', replacementDoctorSchema);

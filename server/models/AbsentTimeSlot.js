
const mongoose = require('mongoose');

const absentTimeSlotSchema = new mongoose.Schema({
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
  date: {
    type: Date,
    required: function() { return !this.isDateRange; }
  },
  startTime: {
    type: String,
    required: function() { return !this.isDateRange; }
  },
  endTime: {
    type: String,
    required: function() { return !this.isDateRange; }
  },
  reason: {
    type: String
  },
  isModifiedSession: {
    type: Boolean,
    default: false
  },
  maxPatients: {
    type: Number
  },
  minutesPerPatient: {
    type: Number
  },
  // Optional: target a specific session (null = all sessions for the day)
  timeSlotConfigId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TimeSlotConfig'
  },
  // Date range fields for multi-day absences
  isDateRange: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    required: function() { return this.isDateRange; }
  },
  endDate: {
    type: Date,
    required: function() { return this.isDateRange; }
  }
}, {
  timestamps: {
    createdAt: true,
    updatedAt: true
  }
});

// Index for efficient date range overlap queries
absentTimeSlotSchema.index({ doctorId: 1, dispensaryId: 1, isDateRange: 1, startDate: 1, endDate: 1 });

// Validation: date range must have startDate <= endDate
absentTimeSlotSchema.pre('validate', function(next) {
  if (this.isDateRange) {
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      return next(new Error('Start date must be before or equal to end date'));
    }
    // Date range absences are always full absence
    this.isModifiedSession = false;
  }
  next();
});

module.exports = mongoose.model('AbsentTimeSlot', absentTimeSlotSchema);

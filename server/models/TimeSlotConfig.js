
const mongoose = require('mongoose');

const timeSlotConfigSchema = new mongoose.Schema({
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
  dayOfWeek: { 
    type: Number, 
    required: true,
    min: 0,
    max: 6
  },
  startTime: { 
    type: String, 
    required: true 
  },
  endTime: { 
    type: String, 
    required: true 
  },
  maxPatients: { 
    type: Number, 
    required: true 
  },
  minutesPerPatient: {
    type: Number,
    default: 15,
    required: true
  },
  bookingCutoffMinutes: {
    type: Number,
    default: -60, // offset in minutes relative to start time. -60 = 1 hr before
    required: false
  }
}, { 
  timestamps: {
    createdAt: true,
    updatedAt: true
  } 
});

module.exports = mongoose.model('TimeSlotConfig', timeSlotConfigSchema);

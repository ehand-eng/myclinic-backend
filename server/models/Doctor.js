
const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  specialization: {
    type: String,
    required: true
  },
  qualifications: [String],
  contactNumber: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  profilePicture: String,
  dispensaries: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dispensary'
  }],
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

module.exports = mongoose.model('Doctor', doctorSchema);

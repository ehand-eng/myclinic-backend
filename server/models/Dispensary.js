
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
    required: true 
  },
  description: String,
  doctors: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor' 
  }],
  location: {
    latitude: Number,
    longitude: Number
  }
}, { 
  timestamps: {
    createdAt: true,
    updatedAt: true
  } 
});

module.exports = mongoose.model('Dispensary', dispensarySchema);

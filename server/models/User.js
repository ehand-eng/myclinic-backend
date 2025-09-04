
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true,
    unique: true
  },
  passwordHash: { 
    type: String, 
    required: function() {
      // Required unless user has auth0Id (for backward compatibility during migration)
      return !this.auth0Id;
    }
  },
  auth0Id: {
    type: String,
    required: false
  },
  role: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: false // Will be required after migration complete
  },
  dispensaryIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Dispensary' 
  }],
  isActive: { 
    type: Boolean, 
    default: true 
  },
  lastLogin: Date
}, { 
  timestamps: {
    createdAt: true,
    updatedAt: true
  } 
});

module.exports = mongoose.model('User', userSchema);

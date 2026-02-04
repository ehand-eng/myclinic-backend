const mongoose = require('mongoose');

const queueStatusSchema = new mongoose.Schema({
    dispensaryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Dispensary',
        required: true
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    date: {
        type: String, // YYYY-MM-DD
        required: true
    },
    currentNumber: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to ensure uniqueness for a doctor at a dispensary on a specific date
queueStatusSchema.index({ dispensaryId: 1, doctorId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('QueueStatus', queueStatusSchema);

require('dotenv').config();
const mongoose = require('mongoose');
const Dispensary = require('../models/Dispensary');

async function migrate() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/myclinic';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const result = await Dispensary.updateMany(
      { allowOngoingSessionBookings: { $exists: false } },
      { $set: { allowOngoingSessionBookings: false } }
    );

    console.log(`Successfully migrated ${result.modifiedCount} dispensaries.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();

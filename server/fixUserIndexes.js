/**
 * Script to fix User model indexes
 * Drops existing non-sparse unique indexes on email and mobile
 * Mongoose will recreate them as sparse indexes when the model loads
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndexes() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor-reservation';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // Drop existing indexes on email and mobile
    try {
      await collection.dropIndex('email_1');
      console.log('Dropped email_1 index');
    } catch (err) {
      if (err.codeName === 'IndexNotFound') {
        console.log('email_1 index not found (already dropped or never existed)');
      } else {
        throw err;
      }
    }

    try {
      await collection.dropIndex('mobile_1');
      console.log('Dropped mobile_1 index');
    } catch (err) {
      if (err.codeName === 'IndexNotFound') {
        console.log('mobile_1 index not found (already dropped or never existed)');
      } else {
        throw err;
      }
    }

    // Load the User model to trigger index creation
    const User = require('./models/User');
    
    // Ensure indexes are created (this will create sparse indexes based on the schema)
    await User.createIndexes();
    console.log('Created new sparse indexes on email and mobile');

    console.log('Index fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
}

fixIndexes();


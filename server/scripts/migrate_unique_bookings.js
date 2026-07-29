require('dotenv').config();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');

async function migrate() {
  console.log("Starting concurrency double-booking constraints migration...");

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in the environment variables.');
    }
    
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB.");

    // Step 1: Detect duplicate bookings that will prevent unique indexing.
    console.log("Scanning for preexisting active duplicate bookings across Doctor/Dispensary/Date/Slot...");
    
    const duplicatesResult = await Booking.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { 
        $group: {
          _id: { 
            doctorId: "$doctorId", 
            dispensaryId: "$dispensaryId", 
            bookingDate: "$bookingDate", 
            timeSlot: "$timeSlot" 
          },
          count: { $sum: 1 },
          bookingIds: { $push: "$_id" }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (duplicatesResult.length > 0) {
      console.error("\n❌ ACTION REQUIRED: Found duplicate active bookings!");
      console.error("The unique index cannot be built until these are resolved (deleted or cancelled).");
      
      duplicatesResult.forEach(duplicate => {
        console.log(`\nDuplicate combo:` + 
          `\n - Doctor ID: ${duplicate._id.doctorId}` + 
          `\n - Dispensary ID: ${duplicate._id.dispensaryId}` + 
          `\n - Date: ${duplicate._id.bookingDate}` + 
          `\n - Time Slot: ${duplicate._id.timeSlot}` +
          `\n - Affected Booking Object IDs: ${duplicate.bookingIds.join(', ')}`);
      });

      console.error("\nPlease manually resolve these records in the database, then run this migration script again.");
      process.exit(1);
    } else {
      console.log("✅ No duplicate active bookings detected! Safe to build index.");
      
      // Step 2: Ensure the unique index is explicitly built.
      // background: true creates the index in the background so it doesn't lock production queries.
      console.log("Building unique compound booking index in the background...");
      
      await Booking.collection.createIndex(
        { doctorId: 1, dispensaryId: 1, bookingDate: 1, timeSlot: 1 },
        { 
          unique: true, 
          partialFilterExpression: { status: { $in: ['scheduled', 'checked_in', 'completed', 'no_show'] } }, 
          name: 'uniq_active_slot_booking',
          background: true 
        }
      );
      
      console.log("✅ Migration complete. Unique index 'uniq_active_slot_booking' has been built!");
      process.exit(0);
    }

  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();

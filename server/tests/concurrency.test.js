require('dotenv').config();
const mongoose = require('mongoose');
const assert = require('assert');
const Booking = require('../models/Booking');

async function runTests() {
  console.log("Starting concurrency double-booking tests...\n");

  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI is not defined in the environment variables.');
    
    await mongoose.connect(mongoUri);
    
    // Test Setup
    const doctorId = new mongoose.Types.ObjectId();
    const dispensaryId = new mongoose.Types.ObjectId();
    const mockConfigId = new mongoose.Types.ObjectId();
    const bookingDate = new Date("2028-01-01T00:00:00.000Z");
    const timeSlot = "09:00-09:15";

    // Clean up any test artifacts before we start
    await Booking.deleteMany({ doctorId, dispensaryId, bookingDate, timeSlot });

    console.log("--- Test 1: Sequential Booking Attempt ---");
    // Ensure the first one goes through.
    const booking1 = new Booking({
        patientId: "patient-1",
        doctorId, dispensaryId, bookingDate, timeSlot,
        appointmentNumber: 1, estimatedTime: "09:00",
        patientName: "Alice", patientPhone: "12345", transactionId: "TRX-TEST-1"
    });
    
    await booking1.save();
    console.log("✅ First booking succeeded.");

    // Sequential second attempt should fail
    const booking2 = new Booking({
        patientId: "patient-2",
        doctorId, dispensaryId, bookingDate, timeSlot,
        appointmentNumber: 2, estimatedTime: "09:00",
        patientName: "Bob", patientPhone: "54321", transactionId: "TRX-TEST-2"
    });

    let secondAttemptFailed = false;
    try {
        await booking2.save();
    } catch (e) {
        if (e.code === 11000) secondAttemptFailed = true;
    }
    assert.strictEqual(secondAttemptFailed, true, "Double booking was NOT prevented sequentially.");
    console.log("✅ Double sequential booking explicitly prevented by E11000.");


    console.log("\n--- Test 2: Different Doctor Isolation Check ---");
    const diffDoctorId = new mongoose.Types.ObjectId();
    const diffDoctorBooking = new Booking({
        patientId: "patient-3",
        doctorId: diffDoctorId, dispensaryId, bookingDate, timeSlot,
        appointmentNumber: 1, estimatedTime: "09:00",
        patientName: "Charlie", patientPhone: "33333", transactionId: "TRX-TEST-3"
    });
    await diffDoctorBooking.save(); // Should succeed
    console.log("✅ Isolation enforced: Different doctor for same slot succeeded.");


    console.log("\n--- Test 3: Cancellation Slot-Freed Check ---");
    booking1.status = 'cancelled';
    await booking1.save();

    // Now booking2 (which failed before) should succeed because booking1 is cancelled.
    await booking2.save(); 
    console.log("✅ Slot freed automatically upon cancellation. Rebooking succeeded.");


    console.log("\n--- Test 4: Parallel Race-Condition Simulation ---");
    const raceDoctorId = new mongoose.Types.ObjectId();
    const createRaceBooking = (patientName, txId) => new Booking({
        patientId: "patient-race",
        doctorId: raceDoctorId, dispensaryId, bookingDate, timeSlot,
        appointmentNumber: 1, estimatedTime: "09:00",
        patientName, patientPhone: "99999", transactionId: txId
    }).save();

    // Fire 5 promises simultaneously!
    const results = await Promise.allSettled([
        createRaceBooking("Racer 1", "TRX-RACE-1"),
        createRaceBooking("Racer 2", "TRX-RACE-2"),
        createRaceBooking("Racer 3", "TRX-RACE-3"),
        createRaceBooking("Racer 4", "TRX-RACE-4"),
        createRaceBooking("Racer 5", "TRX-RACE-5")
    ]);

    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');
    
    assert.strictEqual(successes.length, 1, "Expected exactly 1 success out of 5 racing requests");
    assert.strictEqual(failures.length, 4, "Expected exactly 4 failures out of 5 racing requests");
    assert.strictEqual(failures.every(f => f.reason.code === 11000), true, "All racing failures must be E11000 Unique Index Errors");
    
    console.log(`✅ Parallel race-condition handled strictly. (1 Success, ${failures.length} E11000 Failures)`);


    // Test Teardown
    await Booking.deleteMany({ doctorId, dispensaryId });
    await Booking.deleteMany({ doctorId: diffDoctorId, dispensaryId });
    await Booking.deleteMany({ doctorId: raceDoctorId, dispensaryId });

    console.log("\n🎉 All tests passed successfully!");
    process.exit(0);

  } catch (err) {
    console.error("❌ Test execution failed", err);
    process.exit(1);
  }
}

runTests();

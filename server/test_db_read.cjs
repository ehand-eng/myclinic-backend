require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const today = new Date("2026-08-19");
    const startOfDay = new Date(today);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23,59,59,999);
    
    // Check all bookings to see what exactly happened
    const bookings = await Booking.find({});
    console.log(`Found ${bookings.length} total bookings.`);
    const todayBookings = await Booking.find({ bookingDate: { $gte: startOfDay, $lte: endOfDay } });
    console.log(`Found ${todayBookings.length} bookings for Aug 19.`);
    for (const b of todayBookings) {
       console.log(`Patient: ${b.patientName}, ApptNo: ${b.appointmentNumber}, TimeSlot: ${b.timeSlot}, Est: ${b.estimatedTime}, Status: ${b.status}`);
    }
  } catch(e) {
    console.error(e);
  }
}
run().then(() => process.exit());

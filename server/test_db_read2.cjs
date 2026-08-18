require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const Booking = require('./models/Booking');

console.log("URI is", process.env.MONGODB_URI);

async function run() {
  console.log("Connecting...");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected.");
  try {
    const todayBookings = await Booking.find({});
    console.log(`Found ${todayBookings.length} bookings total.`);
    for (const b of todayBookings.slice(0, 5)) {
       console.log(`Patient: ${b.patientName}, ApptNo: ${b.appointmentNumber}, TimeSlot: ${b.timeSlot}, Est: ${b.estimatedTime}, Status: ${b.status}`);
    }
  } catch(e) {
    console.error("Query Error:", e);
  }
}

run().then(() => {
  console.log("Done.");
  process.exit();
}).catch(err => {
  console.error("Top Error:", err);
  process.exit(1);
});

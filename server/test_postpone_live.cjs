const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '.env' });
const User = require('./models/User');
const Booking = require('./models/Booking');
const mongoose = require('mongoose');

async function test() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'hello@ehands.lk' }) || await User.findOne();
  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email, dispensaryIds: user.dispensaryIds },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1h' }
  );

  const testBooking = await Booking.findOne({ patientName: 'Pat 1' });

  try {
    console.log("Sending request for doctorId", testBooking.doctorId);
    const res = await axios.post('http://localhost:5001/api/bookings/session/postpone', {
      doctorId: testBooking.doctorId,
      dispensaryId: testBooking.dispensaryId,
      bookingDate: "2026-08-19",
      newDate: "2026-08-19",
      newTimeSlot: "17:00-19:00",
      timeSlotConfigId: null
    }, { headers: { Authorization: `Bearer ${token}` } });
    console.log("Success", res.data);
  } catch(e) {
    console.log("Error", e.response ? e.response.data : e.message);
  }
}
test().then(() => process.exit()).catch(console.error);

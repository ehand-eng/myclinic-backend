const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const TimeSlotConfig = require('../models/TimeSlotConfig');
const AbsentTimeSlot = require('../models/AbsentTimeSlot');
const DoctorDispensary = require('../models/DoctorDispensary');
const mongoose = require('mongoose');

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ bookingDate: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error getting bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// Get bookings for a doctor at a dispensary on a specific date
router.get('/doctor/:doctorId/dispensary/:dispensaryId/date/:date', async (req, res) => {
  try {
    const { doctorId, dispensaryId, date } = req.params;
    
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const bookings = await Booking.find({
      doctorId: doctorId,
      dispensaryId: dispensaryId,
      bookingDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ appointmentNumber: 1 });
    
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error getting bookings by date:', error);
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
});

// Get a specific booking
router.get('/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json(booking);
  } catch (error) {
    console.error('Error getting booking:', error);
    res.status(500).json({ message: 'Error fetching booking', error: error.message });
  }
});

// Get bookings for a specific patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const bookings = await Booking.find({ patientId: req.params.patientId })
      .sort({ bookingDate: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error getting patient bookings:', error);
    res.status(500).json({ message: 'Error fetching patient bookings', error: error.message });
  }
});

// Create a new booking
router.post('/', async (req, res) => {
  try {
    const {
      doctorId,
      dispensaryId,
      bookingDate,
      patientName,
      patientPhone,
      patientEmail,
      symptoms,
      fees
    } = req.body;

    console.log("Received booking request:", req.body);
    
    // Generate a temporary patientId if not provided
    const patientId = req.body.patientId || `temp-${patientPhone}`;
    
    // Generate transaction ID
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const transactionId = `TRX-${timestamp}-${random}`;
    
    // Generate booking date from string - ensure we use the date only
    // Create date with the local timezone, without any time component
    const parsedDate = bookingDate.split('T')[0];
    const parsedBookingDate = new Date(bookingDate);
    
    console.log("Parsed booking date:", parsedBookingDate);
    
    // 1. Find the next available appointment
    const dayOfWeek = parsedBookingDate.getDay();
    console.log("Day of week:", dayOfWeek);
    
    // Get the time slot configuration
    const timeSlotConfig = await TimeSlotConfig.findOne({
      doctorId,
      dispensaryId,
      dayOfWeek
    });
    
    console.log("Time slot config:", timeSlotConfig);
    
    if (!timeSlotConfig) {
      return res.status(400).json({ 
        message: 'No time slot configuration found for this doctor and dispensary on this day' 
      });
    }
    
    // Check if there's a modified session for this date
    const startOfDay = new Date(parsedBookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(parsedBookingDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const absentSlot = await AbsentTimeSlot.findOne({
      doctorId,
      dispensaryId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    console.log("Absent/Modified slot:", absentSlot);
    
    // If completely absent (not a modified session), return an error
    if (absentSlot && !absentSlot.isModifiedSession) {
      return res.status(400).json({ 
        message: 'Doctor is not available on this date' 
      });
    }
    
    // Determine session parameters based on regular config or modified session
    let startTime, endTime, maxPatients, minutesPerPatient;
    
    if (absentSlot && absentSlot.isModifiedSession) {
      startTime = absentSlot.startTime;
      endTime = absentSlot.endTime;
      maxPatients = absentSlot.maxPatients || timeSlotConfig.maxPatients;
      minutesPerPatient = absentSlot.minutesPerPatient || timeSlotConfig.minutesPerPatient;
    } else {
      startTime = timeSlotConfig.startTime;
      endTime = timeSlotConfig.endTime;
      maxPatients = timeSlotConfig.maxPatients;
      minutesPerPatient = timeSlotConfig.minutesPerPatient || 15; // Default to 15 minutes if not set
    }
    
    console.log("Session parameters:", { startTime, endTime, maxPatients, minutesPerPatient });
    
    // Find existing bookings for this session
    const existingBookings = await Booking.find({
      doctorId,
      dispensaryId,
      bookingDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $ne: 'cancelled' }
    }).sort({ appointmentNumber: 1 });
    
    console.log("Existing bookings count:", existingBookings.length);
    
    // If all slots are booked
    if (existingBookings.length >= maxPatients) {
      return res.status(400).json({ 
        message: 'All appointments for this day are booked' 
      });
    }
    
    // Find the next available appointment number
    let nextAppointmentNumber = 1;
    
    // Create a set of existing appointment numbers for quick lookup
    const bookedAppointments = new Set();
    existingBookings.forEach(booking => {
      bookedAppointments.add(booking.appointmentNumber);
    });
    
    // Find the first available appointment number
    while (bookedAppointments.has(nextAppointmentNumber) && nextAppointmentNumber <= maxPatients) {
      nextAppointmentNumber++;
    }
    
    console.log("Next appointment number:", nextAppointmentNumber);
    
    // Calculate the estimated time for this appointment
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const appointmentOffset = (nextAppointmentNumber - 1) * minutesPerPatient; // Minutes from start time
    
    const appointmentDateTime = new Date(parsedBookingDate);
    appointmentDateTime.setHours(startHour, startMinute, 0, 0);
    appointmentDateTime.setMinutes(appointmentDateTime.getMinutes() + appointmentOffset);
    
    const estimatedHours = appointmentDateTime.getHours().toString().padStart(2, '0');
    const estimatedMinutes = appointmentDateTime.getMinutes().toString().padStart(2, '0');
    const estimatedTime = `${estimatedHours}:${estimatedMinutes}`;
    
    console.log("Estimated time:", estimatedTime);
    
    // Calculate the time slot range (e.g., "18:00-18:20")
    const endOfAppointment = new Date(appointmentDateTime);
    endOfAppointment.setMinutes(endOfAppointment.getMinutes() + minutesPerPatient);
    
    const endHours = endOfAppointment.getHours().toString().padStart(2, '0');
    const endMinutes = endOfAppointment.getMinutes().toString().padStart(2, '0');
    
    const timeSlot = `${estimatedHours}:${estimatedMinutes}-${endHours}:${endMinutes}`;
    
    // Create the booking
    let bookedUser = 'online';
    let bookedBy = 'ONLINE';

    // If you use JWT auth and have req.user, use that:
    if (req.user) {
      bookedUser = req.user.id || req.user._id || 'online';
      bookedBy = req.user.role ? req.user.role.toUpperCase() : 'ONLINE';
    } else if (req.body.bookedUser && req.body.bookedBy) {
      // Optionally allow frontend to send these fields
      bookedUser = req.body.bookedUser;
      bookedBy = req.body.bookedBy;
    }

    const booking = new Booking({
      patientId,
      doctorId,
      dispensaryId,
      bookingDate: parsedBookingDate,
      timeSlot,
      appointmentNumber: nextAppointmentNumber,
      estimatedTime,
      status: 'scheduled',
      symptoms,
      isPaid: false,
      isPatientVisited: false,
      patientName,
      patientPhone,
      patientEmail,
      transactionId,
      fees,
      bookedUser,
      bookedBy,
    });
    
    await booking.save();
    console.log("Booking created successfully:", booking);
    res.status(201).json(booking);
    
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
});

// Update booking status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, checkedInTime, completedTime, notes, isPaid, isPatientVisited } = req.body;
    
    const updateData = { 
      status,
      ...(checkedInTime && { checkedInTime }),
      ...(completedTime && { completedTime }),
      ...(notes && { notes }),
      ...(typeof isPaid !== 'undefined' && { isPaid }),
      ...(typeof isPatientVisited !== 'undefined' && { isPatientVisited })
    };
    
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.status(200).json(booking);
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Error updating booking', error: error.message });
  }
});

// Cancel booking
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { reason } = req.body;
    
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    booking.status = 'cancelled';
    if (reason) {
      booking.notes = booking.notes 
        ? `${booking.notes} Cancellation reason: ${reason}`
        : `Cancellation reason: ${reason}`;
    }
    
    await booking.save();
    res.status(200).json(booking);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Error cancelling booking', error: error.message });
  }
});

// New endpoint to get the next available appointment
router.get('/next-available/:doctorId/:dispensaryId/:date', async (req, res) => {
  try {
    const { doctorId, dispensaryId, date } = req.params;
    
    // Parse the date - ensure it's just the date part
    const parsedDate = date.split('T')[0];
    const bookingDate = new Date(parsedDate + 'T00:00:00');
    
    // Get day of week (0-6, where 0 is Sunday)
    const dayOfWeek = bookingDate.getDay();
    
    // 1. Get the regular time slot configuration for this day
    const timeSlotConfig = await TimeSlotConfig.findOne({
      doctorId,
      dispensaryId,
      dayOfWeek
    });
    
    if (!timeSlotConfig) {
      return res.status(404).json({ message: 'No time slot configuration found for this day' });
    }
    
    // 2. Check if there's a modified/absent session for this specific date
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    const absentSlot = await AbsentTimeSlot.findOne({
      doctorId,
      dispensaryId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    // Variables to hold session details
    let startTime, endTime, minutesPerPatient, maxPatients;
    
    // If completely absent, return no slots
    if (absentSlot && !absentSlot.isModifiedSession) {
      return res.status(404).json({ message: 'Doctor is not available on this date' });
    } 
    // If modified session, use those parameters
    else if (absentSlot && absentSlot.isModifiedSession) {
      startTime = absentSlot.startTime;
      endTime = absentSlot.endTime;
      maxPatients = absentSlot.maxPatients || timeSlotConfig.maxPatients;
      minutesPerPatient = absentSlot.minutesPerPatient || timeSlotConfig.minutesPerPatient;
    } 
    // Otherwise use the regular config
    else {
      startTime = timeSlotConfig.startTime;
      endTime = timeSlotConfig.endTime;
      maxPatients = timeSlotConfig.maxPatients;
      minutesPerPatient = timeSlotConfig.minutesPerPatient || 15; // Default to 15 minutes if not set
    }
    
    // 3. Get already booked appointments for this day
    const existingBookings = await Booking.find({
      doctorId,
      dispensaryId,
      bookingDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $ne: 'cancelled' }
    }).sort({ appointmentNumber: 1 });
    
    // If all slots are booked
    if (existingBookings.length >= maxPatients) {
      return res.status(404).json({ message: 'All appointments for this day are booked' });
    }
    
    // 4. Find the next available appointment number
    let nextAppointmentNumber = 1;
    
    // Create a set of existing appointment numbers for quick lookup
    const bookedAppointments = new Set();
    existingBookings.forEach(booking => {
      bookedAppointments.add(booking.appointmentNumber);
    });
    
    // Find the first available appointment number
    while (bookedAppointments.has(nextAppointmentNumber) && nextAppointmentNumber <= maxPatients) {
      nextAppointmentNumber++;
    }
    
    // 5. Calculate the estimated time for this appointment
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const appointmentOffset = (nextAppointmentNumber - 1) * minutesPerPatient; // Minutes from start time
    
    const appointmentDateTime = new Date(bookingDate);
    appointmentDateTime.setHours(startHour, startMinute, 0, 0);
    appointmentDateTime.setMinutes(appointmentDateTime.getMinutes() + appointmentOffset);
    
    const estimatedHours = appointmentDateTime.getHours().toString().padStart(2, '0');
    const estimatedMinutes = appointmentDateTime.getMinutes().toString().padStart(2, '0');
    const estimatedTime = `${estimatedHours}:${estimatedMinutes}`;
    
    // Calculate the time slot range (e.g., "18:00-18:20")
    const endOfAppointment = new Date(appointmentDateTime);
    endOfAppointment.setMinutes(endOfAppointment.getMinutes() + minutesPerPatient);
    
    const endHours = endOfAppointment.getHours().toString().padStart(2, '0');
    const endMinutes = endOfAppointment.getMinutes().toString().padStart(2, '0');
    
    const timeSlot = `${estimatedHours}:${estimatedMinutes}-${endHours}:${endMinutes}`;
    
    // Return the next available appointment info
    res.status(200).json({
      appointmentNumber: nextAppointmentNumber,
      timeSlot,
      estimatedTime,
      minutesPerPatient
    });
    
  } catch (error) {
    console.error('Error getting next available appointment:', error);
    res.status(500).json({
      message: 'Error fetching next available appointment',
      error: error.message
    });
  }
});

// Get booking summary by transaction ID
router.get('/summary/:transactionId', async (req, res) => {
  try {
    const booking = await Booking.findOne({ transactionId: req.params.transactionId })
      .populate('doctorId', 'name specialization')
      .populate('dispensaryId', 'name address');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Get fee information for this doctor-dispensary combination
    const feeInfo = await DoctorDispensary.findOne({
      doctorId: booking.doctorId._id,
      dispensaryId: booking.dispensaryId._id,
      isActive: true
    });

    // Format the summary data
    const summary = {
      transactionId: booking.transactionId,
      bookingDate: booking.bookingDate,
      timeSlot: booking.timeSlot,
      appointmentNumber: booking.appointmentNumber,
      estimatedTime: booking.estimatedTime,
      status: booking.status,
      patient: {
        name: booking.patientName,
        phone: booking.patientPhone,
        email: booking.patientEmail
      },
      doctor: {
        name: booking.doctorId.name,
        specialization: booking.doctorId.specialization
      },
      dispensary: {
        name: booking.dispensaryId.name,
        address: booking.dispensaryId.address
      },
      fees: feeInfo ? {
        doctorFee: feeInfo.doctorFee,
        dispensaryFee: feeInfo.dispensaryFee,
        bookingCommission: feeInfo.bookingCommission,
        totalAmount: feeInfo.doctorFee + feeInfo.dispensaryFee + feeInfo.bookingCommission
      } : null,
      symptoms: booking.symptoms,
      bookedUser: booking.bookedUser,
      bookedBy: booking.bookedBy,
      createdAt: booking.createdAt
    };

    res.json(summary);
  } catch (error) {
    console.error('Error getting booking summary:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

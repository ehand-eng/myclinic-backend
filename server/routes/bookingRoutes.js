const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const TimeSlotConfig = require('../models/TimeSlotConfig');
const AbsentTimeSlot = require('../models/AbsentTimeSlot');
const DoctorDispensary = require('../models/DoctorDispensary');
const mongoose = require('mongoose');
const roleMiddleware = require('../middleware/roleMiddleware');
const { validateCustomJwt } = require('../middleware/customAuthMiddleware');
const fcmServerClient = require('../services/fcmServerClient');

// Search bookings - restricted to Super Admin and Dispensary Admin only
router.get('/search', roleMiddleware.requireAdvancedBookingAccess, async (req, res) => {
  try {
    console.log("======== bookingRoutes ============== "+req.query);
    const { query, searchType } = req.query;
    
    // Validate required parameters
    if (!query || !query.trim()) {
      return res.status(400).json({ 
        message: 'Search query is required',
        example: '/api/bookings/search?query=0773837922&searchType=phone'
      });
    }

    if (!searchType) {
      return res.status(400).json({ 
        message: 'searchType parameter is required',
        validTypes: ['id', 'transactionId', 'phone', 'name'],
        example: '/api/bookings/search?query=0773837922&searchType=phone'
      });
    }

    const trimmedQuery = query.trim();
    let searchCriteria = {};
    
    // Build search criteria based on searchType - NEVER cast to ObjectId unless searchType is "id"
    switch (searchType) {
      case 'id':
        // Only cast to ObjectId when specifically searching by _id
        if (!mongoose.Types.ObjectId.isValid(trimmedQuery)) {
          return res.status(400).json({ 
            message: 'Invalid booking ID format. Must be a valid MongoDB ObjectId.',
            example: '507f1f77bcf86cd799439011'
          });
        }
        searchCriteria = { _id: new mongoose.Types.ObjectId(trimmedQuery) };
        break;
        
      case 'transactionId':
        // Exact match for transaction ID
        searchCriteria = { transactionId: trimmedQuery };
        break;
        
      case 'phone':
        // Exact or partial match for phone number
        searchCriteria = { patientPhone: { $regex: trimmedQuery, $options: 'i' } };
        break;
        
      case 'name':
        // Case-insensitive partial match for patient name
        searchCriteria = { patientName: { $regex: trimmedQuery, $options: 'i' } };
        break;
        
      default:
        return res.status(400).json({ 
          message: `Invalid searchType: "${searchType}"`,
          validTypes: ['id', 'transactionId', 'phone', 'name'],
          example: '/api/bookings/search?query=0773837922&searchType=phone'
        });
    }

    console.log(`Searching bookings with criteria:`, JSON.stringify(searchCriteria));

    // Execute the search query
    const bookings = await Booking.find(searchCriteria)
      .populate('doctorId', 'name specialization')
      .populate('dispensaryId', 'name address')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(); // Use lean() for better performance

    // Handle no results case
    if (!bookings || bookings.length === 0) {
      return res.status(200).json({ 
        message: 'No bookings found',
        searchType,
        query: trimmedQuery,
        count: 0,
        results: []
      });
    }

    // Format the results safely
    const searchResults = bookings.map(booking => ({
      _id: booking._id,
      transactionId: booking.transactionId || 'N/A',
      patientName: booking.patientName || 'Unknown',
      patientPhone: booking.patientPhone || 'N/A',
      patientEmail: booking.patientEmail || null,
      doctorName: booking.doctorId?.name || 'Unknown Doctor',
      doctorSpecialization: booking.doctorId?.specialization || 'Unknown',
      dispensaryName: booking.dispensaryId?.name || 'Unknown Dispensary',
      dispensaryAddress: booking.dispensaryId?.address || 'Unknown Address',
      bookingDate: booking.bookingDate,
      estimatedTime: booking.estimatedTime || 'N/A',
      appointmentNumber: booking.appointmentNumber || 0,
      status: booking.status || 'unknown',
      symptoms: booking.symptoms || null,
      createdAt: booking.createdAt
    }));

    // Return successful response
    res.status(200).json({
      message: `Found ${searchResults.length} booking${searchResults.length !== 1 ? 's' : ''}`,
      searchType,
      query: trimmedQuery,
      count: searchResults.length,
      results: searchResults
    });

  } catch (error) {
    console.error('Error in booking search:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid search parameters',
        error: 'Data type mismatch in search query',
        searchType: req.query.searchType,
        query: req.query.query
      });
    }

    // Generic error response
    res.status(500).json({ 
      message: 'Server error during booking search',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      searchType: req.query.searchType,
      count: 0,
      results: []
    });
  }
});

// Get current user's bookings - for online users
router.get('/my', validateCustomJwt, async (req, res) => {
  try {
    console.log("Getting bookings for user:", req.user);

    // For online users, find bookings by phone/email since they might not have userId in booking
    let searchCriteria = {};

    if (req.user.role === 'online') {
      // For online users, search by email or phone
      searchCriteria = {
        $or: [
          { patientEmail: req.user.email },
          { bookedUser: req.user.id }
        ]
      };
    } else {
      // For admin users, show all bookings they have access to
      searchCriteria = { bookedUser: req.user.id };
    }

    const bookings = await Booking.find(searchCriteria)
      .populate('doctorId', 'name specialization')
      .populate('dispensaryId', 'name address')
      .sort({ bookingDate: -1 })
      .lean();

    // Format the results for frontend consumption
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      transactionId: booking.transactionId,
      patientName: booking.patientName,
      patientPhone: booking.patientPhone,
      patientEmail: booking.patientEmail,
      doctor: {
        name: booking.doctorId?.name || 'Unknown',
        specialization: booking.doctorId?.specialization || 'Unknown'
      },
      dispensary: {
        name: booking.dispensaryId?.name || 'Unknown',
        address: booking.dispensaryId?.address || 'Unknown'
      },
      bookingDate: booking.bookingDate,
      timeSlot: booking.timeSlot,
      estimatedTime: booking.estimatedTime,
      appointmentNumber: booking.appointmentNumber,
      status: booking.status,
      symptoms: booking.symptoms,
      fees: booking.fees,
      createdAt: booking.createdAt,
      isPaid: booking.isPaid,
      isPatientVisited: booking.isPatientVisited
    }));

    res.status(200).json({
      message: `Found ${formattedBookings.length} booking${formattedBookings.length !== 1 ? 's' : ''}`,
      count: formattedBookings.length,
      bookings: formattedBookings
    });

  } catch (error) {
    console.error('Error getting user bookings:', error);
    res.status(500).json({
      message: 'Error fetching your bookings',
      error: error.message
    });
  }
});

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
    console.log("======== booking ============== "+req.params.id);
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
    console.log("======== user ============== "+req.user);
    
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
    
    // Create the booking with role-based logic
    let bookedUser = 'online';
    let bookedBy = 'ONLINE';

    // Check for user role from multiple sources (for flexibility)
    console.log("Incoming booking request role sources:", {
      reqUser: req.user,
      headerRole: req.headers['x-user-role'],
      bodyRole: req.body.userRole,
      bookedUser: req.body.bookedUser
    });

    let userRole = null;
    if (req.user && req.user.role) {
      userRole = req.user.role.toLowerCase();
      bookedUser = req.user.id || req.user._id || 'online';
    } else if (req.headers['x-user-role']) {
      userRole = req.headers['x-user-role'].toLowerCase();
      bookedUser = req.body.bookedUser || req.user?.id || 'online';
    } else if (req.body.userRole) {
      userRole = req.body.userRole.toLowerCase();
      bookedUser = req.body.bookedUser || 'online';
    }
    
    console.log("======== userRole ===  11111 =========== "+userRole);
    
    // Normalize role for consistent checking
    const normalizedUserRole = userRole ? userRole.toLowerCase().replace(/\s+/g, '-') : '';
    
    console.log("Checking role access:", { 
      userRole: userRole, 
      normalizedUserRole: normalizedUserRole,
      operation: 'booking creation'
    });
    
    // Set bookedBy based on normalized role
    if (normalizedUserRole === 'channel-partner') {
      bookedBy = 'CHANNEL-PARTNER';
      bookedUser = req.body.bookedUser || req.user?.id || bookedUser;
    } else if (normalizedUserRole === 'super-admin') {
      bookedBy = 'SUPER-ADMIN';
    } else if (normalizedUserRole === 'dispensary-admin') {
      bookedBy = 'DISPENSARY-ADMIN';
    } else if (normalizedUserRole === 'dispensary-staff') {
      bookedBy = 'DISPENSARY-STAFF';
    }

    console.log(`Final booking role assignment:`, {
      userRole,
      bookedBy,
      bookedUser,
      isChannelPartner: bookedBy === 'CHANNEL-PARTNER'
    });

    // Handle channel partner fee calculation and ensure correct totalFee calculation
    let processedFees = { ...fees };
    
    // Get channel partner fee configuration from DoctorDispensary for all bookings
    const feeConfig = await DoctorDispensary.findOne({
      doctorId,
      dispensaryId,
      isActive: true
    });

    if (bookedBy === 'CHANNEL-PARTNER' && feeConfig && feeConfig.channelPartnerFee > 0) {
      // For channel partner bookings: reduce bookingCommission by channelPartnerFee
      const originalBookingCommission = processedFees.bookingCommission || 0;
      const channelPartnerFee = feeConfig.channelPartnerFee;
      const adjustedBookingCommission = Math.max(0, originalBookingCommission - channelPartnerFee);

      processedFees = {
        ...processedFees,
        channelPartnerFee: channelPartnerFee,
        bookingCommission: adjustedBookingCommission
      };

      console.log(`Channel partner fee applied - Fee: ${channelPartnerFee}, Adjusted commission: ${adjustedBookingCommission}`);
    } else {
      // For non-channel partner bookings: ensure channelPartnerFee is 0
      processedFees = {
        ...processedFees,
        channelPartnerFee: 0
      };
    }

    // Always recalculate totalFee using the correct formula:
    // totalFee = doctorFee + dispensaryFee + channelPartnerFee + bookingCommission
    const doctorFee = processedFees.doctorFee || 0;
    const dispensaryFee = processedFees.dispensaryFee || 0;
    const channelPartnerFee = processedFees.channelPartnerFee || 0;
    const bookingCommission = processedFees.bookingCommission || 0;
    
    processedFees.totalFee = doctorFee + dispensaryFee + channelPartnerFee + bookingCommission;
    
    console.log(`Final fee calculation:`, {
      doctorFee,
      dispensaryFee,
      channelPartnerFee,
      bookingCommission,
      totalFee: processedFees.totalFee,
      bookedBy
    });

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
      fees: processedFees,
      bookedUser,
      bookedBy,
    });
    
    await booking.save();
    console.log("Booking created successfully:", booking);

    // Send FCM notification to the patient
    await fcmServerClient.sendNotification("BPT1zMXQaTa-d3We90UFv8u32Yljil4_4zu2yKEOz81331JRZU-qNY0q5peAhuDgX3YetDWm7N2WIZqRBHIzyMQ", 
      'Booking Created', 'Your booking has been created successfully');

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

// Search bookings by multiple criteria


// Get booking summary by transaction ID - restricted to Super Admin and Dispensary Admin only
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
      _id: booking._id,
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

// Adjust booking to new date/time - restricted to Super Admin and Dispensary Admin only
router.patch('/:id/adjust', roleMiddleware.requireAdvancedBookingAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, doctorId, dispensaryId } = req.body;

    // Find the existing booking
    const existingBooking = await Booking.findById(id);
    if (!existingBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking can be adjusted (only scheduled bookings)
    if (existingBooking.status !== 'scheduled') {
      return res.status(400).json({ 
        message: 'Only scheduled bookings can be adjusted' 
      });
    }

    // Parse the new date
    const parsedDate = new Date(newDate);
    const dayOfWeek = parsedDate.getDay();
    
    // Get the time slot configuration for the new date
    const timeSlotConfig = await TimeSlotConfig.findOne({
      doctorId: doctorId || existingBooking.doctorId,
      dispensaryId: dispensaryId || existingBooking.dispensaryId,
      dayOfWeek
    });
    
    if (!timeSlotConfig) {
      return res.status(400).json({ 
        message: 'No time slot configuration found for this doctor and dispensary on the new date' 
      });
    }

    // Check if there's a modified session for the new date
    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(parsedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const absentSlot = await AbsentTimeSlot.findOne({
      doctorId: doctorId || existingBooking.doctorId,
      dispensaryId: dispensaryId || existingBooking.dispensaryId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });
    
    // If completely absent, return an error
    if (absentSlot && !absentSlot.isModifiedSession) {
      return res.status(400).json({ 
        message: 'Doctor is not available on the new date' 
      });
    }
    
    // Determine session parameters
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
      minutesPerPatient = timeSlotConfig.minutesPerPatient || 15;
    }
    
    // Find existing bookings for the new date (excluding the current booking being adjusted)
    const existingBookings = await Booking.find({
      _id: { $ne: id }, // Exclude current booking
      doctorId: doctorId || existingBooking.doctorId,
      dispensaryId: dispensaryId || existingBooking.dispensaryId,
      bookingDate: {
        $gte: startOfDay,
        $lte: endOfDay
      },
      status: { $ne: 'cancelled' }
    }).sort({ appointmentNumber: 1 });
    
    // If all slots are booked for the new date
    if (existingBookings.length >= maxPatients) {
      return res.status(400).json({ 
        message: 'All appointments for the new date are booked' 
      });
    }
    
    // Find the next available appointment number for the new date
    let nextAppointmentNumber = 1;
    const bookedAppointments = new Set();
    existingBookings.forEach(booking => {
      bookedAppointments.add(booking.appointmentNumber);
    });
    
    while (bookedAppointments.has(nextAppointmentNumber) && nextAppointmentNumber <= maxPatients) {
      nextAppointmentNumber++;
    }
    
    // Calculate the estimated time for the new appointment
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const appointmentOffset = (nextAppointmentNumber - 1) * minutesPerPatient;
    
    const appointmentDateTime = new Date(parsedDate);
    appointmentDateTime.setHours(startHour, startMinute, 0, 0);
    appointmentDateTime.setMinutes(appointmentDateTime.getMinutes() + appointmentOffset);
    
    const estimatedHours = appointmentDateTime.getHours().toString().padStart(2, '0');
    const estimatedMinutes = appointmentDateTime.getMinutes().toString().padStart(2, '0');
    const estimatedTime = `${estimatedHours}:${estimatedMinutes}`;
    
    // Calculate the time slot range
    const endOfAppointment = new Date(appointmentDateTime);
    endOfAppointment.setMinutes(endOfAppointment.getMinutes() + minutesPerPatient);
    
    const endHours = endOfAppointment.getHours().toString().padStart(2, '0');
    const endMinutes = endOfAppointment.getMinutes().toString().padStart(2, '0');
    
    const timeSlot = `${estimatedHours}:${estimatedMinutes}-${endHours}:${endMinutes}`;
    
    // Update the existing booking with new date/time information
    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      {
        doctorId: doctorId || existingBooking.doctorId,
        dispensaryId: dispensaryId || existingBooking.dispensaryId,
        bookingDate: parsedDate,
        timeSlot,
        appointmentNumber: nextAppointmentNumber,
        estimatedTime,
        // Keep all other fields the same (patient info, fees, etc.)
      },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      return res.status(500).json({ message: 'Failed to update booking' });
    }

    console.log("Booking adjusted successfully:", updatedBooking);
    res.status(200).json({
      message: 'Booking adjusted successfully',
      booking: updatedBooking
    });
    
  } catch (error) {
    console.error('Error adjusting booking:', error);
    res.status(500).json({ 
      message: 'Error adjusting booking', 
      error: error.message 
    });
  }
});

module.exports = router;

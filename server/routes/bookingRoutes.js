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
const smsService = require('../services/smsService');

// Search bookings - restricted to Super Admin and Dispensary Admin only
router.get('/search', roleMiddleware.requireAdvancedBookingAccess, async (req, res) => {
  try {
    console.log("======== bookingRoutes ============== " + req.query);
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
        _id: booking.doctorId?._id,
        name: booking.doctorId?.name || 'Unknown',
        specialization: booking.doctorId?.specialization || 'Unknown'
      },
      dispensary: {
        _id: booking.dispensaryId?._id,
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

// Get bookings by date (optional dispensaryId for dispensary-admin)
// GET /bookings/by-date?date=YYYY-MM-DD&dispensaryId=optional
router.get('/by-date', async (req, res) => {
  try {
    const { date, dispensaryId } = req.query;
    if (!date || typeof date !== 'string') {
      return res.status(400).json({ message: 'Query parameter date (YYYY-MM-DD) is required' });
    }
    const startOfDay = new Date(date + 'T00:00:00');
    const endOfDay = new Date(date + 'T23:59:59.999');
    const query = {
      bookingDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    };
    if (dispensaryId && typeof dispensaryId === 'string') {
      query.dispensaryId = dispensaryId;
    }
    const bookings = await Booking.find(query)
      .populate('doctorId', 'name specialization')
      .populate('dispensaryId', 'name address')
      .sort({ appointmentNumber: 1, estimatedTime: 1 })
      .lean();
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error getting bookings by date:', error);
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

// Get available slots for a doctor/dispensary on a date (for amendment flow)
router.get('/available-slots/:doctorId/:dispensaryId/:date', async (req, res) => {
  try {
    const { doctorId, dispensaryId, date } = req.params;
    const { excludeBookingId } = req.query;

    const parsedDate = new Date(date + 'T00:00:00');
    const dayOfWeek = parsedDate.getDay();

    const timeSlotConfigs = await TimeSlotConfig.find({ doctorId, dispensaryId, dayOfWeek }).sort({ startTime: 1 });
    if (!timeSlotConfigs || timeSlotConfigs.length === 0) {
      return res.json({ available: false, message: 'No session configured for this day', slots: [] });
    }

    const startOfDay = new Date(parsedDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(parsedDate); endOfDay.setHours(23, 59, 59, 999);

    // Check full-day absences
    const dateRangeAbsent = await AbsentTimeSlot.findOne({
      doctorId, dispensaryId, isDateRange: true,
      startDate: { $lte: endOfDay }, endDate: { $gte: startOfDay }
    });
    if (dateRangeAbsent) {
      return res.json({ available: false, message: 'Doctor is not available on this date', slots: [] });
    }

    const absentSlot = await AbsentTimeSlot.findOne({
      doctorId, dispensaryId, isDateRange: { $ne: true },
      isModifiedSession: false, timeSlotConfigId: { $exists: false },
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    if (absentSlot) {
      return res.json({ available: false, message: 'Doctor is not available on this date', slots: [] });
    }

    const query = {
      doctorId, dispensaryId,
      bookingDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    };
    if (excludeBookingId) query._id = { $ne: excludeBookingId };
    const existingBookings = await Booking.find(query);

    // Build slots across all sessions
    const allSlots = [];
    let totalSlots = 0;
    let bookedCount = 0;

    for (const config of timeSlotConfigs) {
      const configId = config._id.toString();
      const sessionBookings = existingBookings.filter(b =>
        b.timeSlotConfigId && b.timeSlotConfigId.toString() === configId
      );
      if (timeSlotConfigs.length === 1) {
        sessionBookings.push(...existingBookings.filter(b => !b.timeSlotConfigId));
      }
      const bookedNumbers = new Set(sessionBookings.map(b => b.appointmentNumber));

      const startTime = config.startTime;
      const maxPatients = config.maxPatients;
      const minutesPerPatient = config.minutesPerPatient || 15;
      const [startHour, startMinute] = startTime.split(':').map(Number);

      totalSlots += maxPatients;
      bookedCount += bookedNumbers.size;

      for (let i = 1; i <= maxPatients; i++) {
        if (!bookedNumbers.has(i)) {
          const offset = (i - 1) * minutesPerPatient;
          const slotDate = new Date(parsedDate);
          slotDate.setHours(startHour, startMinute + offset, 0, 0);
          const endSlotDate = new Date(slotDate);
          endSlotDate.setMinutes(endSlotDate.getMinutes() + minutesPerPatient);

          const fmt = (d) => `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
          allSlots.push({
            appointmentNumber: i,
            estimatedTime: fmt(slotDate),
            timeSlot: `${fmt(slotDate)}-${fmt(endSlotDate)}`,
            timeSlotConfigId: configId
          });
        }
      }
    }

    res.json({
      available: allSlots.length > 0,
      totalSlots,
      bookedSlots: bookedCount,
      availableSlots: allSlots.length,
      slots: allSlots
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ message: 'Error fetching available slots', error: error.message });
  }
});

// Get a specific booking
router.get('/:id', async (req, res) => {
  try {
    console.log("======== booking ============== " + req.params.id);
    const booking = await Booking.findById(req.params.id)
      .populate('doctorId', 'name specialization')
      .populate('dispensaryId', 'name address');
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
      fees,
      paymentMethod,
      paymentStatus
    } = req.body;

    console.log("Received booking request:", req.body);
    console.log("======== user ============== " + req.user);

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
    // If timeSlotConfigId is provided in request, use it; otherwise find by dayOfWeek
    let timeSlotConfig = null;

    if (req.body.timeSlotConfigId) {
      timeSlotConfig = await TimeSlotConfig.findById(req.body.timeSlotConfigId);
      if (!timeSlotConfig ||
        timeSlotConfig.doctorId.toString() !== doctorId ||
        timeSlotConfig.dispensaryId.toString() !== dispensaryId) {
        return res.status(400).json({
          message: 'Invalid timeSlotConfigId or mismatch with doctor/dispensary'
        });
      }
    } else {
      // Fallback: find first config for this day (for backward compatibility with single session)
      const configs = await TimeSlotConfig.find({ doctorId, dispensaryId, dayOfWeek }).sort({ startTime: 1 });
      timeSlotConfig = configs.length > 0 ? configs[0] : null;
    }

    console.log("Time slot config:", timeSlotConfig);

    if (!timeSlotConfig) {
      return res.status(400).json({
        message: 'No time slot configuration found for this doctor and dispensary on this day'
      });
    }

    // Check absences for this date
    const startOfDay = new Date(parsedBookingDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(parsedBookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Check date-range absences
    const dateRangeAbsent = await AbsentTimeSlot.findOne({
      doctorId, dispensaryId,
      isDateRange: true,
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay }
    });

    if (dateRangeAbsent) {
      return res.status(400).json({ message: 'Doctor is not available on this date' });
    }

    // Check full-day absence (no timeSlotConfigId)
    const fullDayAbsent = await AbsentTimeSlot.findOne({
      doctorId, dispensaryId,
      isDateRange: { $ne: true },
      isModifiedSession: false,
      timeSlotConfigId: { $exists: false },
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (fullDayAbsent) {
      return res.status(400).json({ message: 'Doctor is not available on this date' });
    }

    // Check per-session absent/modified for this specific timeSlotConfig
    const configId = timeSlotConfig._id;
    let absentSlot = await AbsentTimeSlot.findOne({
      doctorId, dispensaryId,
      isDateRange: { $ne: true },
      timeSlotConfigId: configId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // Also check legacy absent slots (no timeSlotConfigId)
    if (!absentSlot) {
      absentSlot = await AbsentTimeSlot.findOne({
        doctorId, dispensaryId,
        isDateRange: { $ne: true },
        timeSlotConfigId: { $exists: false },
        date: { $gte: startOfDay, $lte: endOfDay }
      });
    }

    // If this specific session is marked absent
    if (absentSlot && !absentSlot.isModifiedSession) {
      return res.status(400).json({ message: 'This session is not available on this date' });
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
      minutesPerPatient = timeSlotConfig.minutesPerPatient || 15;
    }

    console.log("Session parameters:", { startTime, endTime, maxPatients, minutesPerPatient });

    // Find existing bookings for this specific session
    const bookingQuery = {
      doctorId,
      dispensaryId,
      bookingDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    };
    // Scope to specific session if timeSlotConfigId is provided
    if (req.body.timeSlotConfigId) {
      bookingQuery.timeSlotConfigId = configId;
    }
    const existingBookings = await Booking.find(bookingQuery).sort({ appointmentNumber: 1 });
    console.log("&&&&&&&&&&&&&&&&&&&& Existing bookings:::::::::::::", existingBookings);
    console.log("&&&&&&&&&&&&&&&&&&&& Existing bookings count:", existingBookings.length);

    // If all slots are booked
    if (existingBookings.length >= maxPatients) {
      return res.status(400).json({
        message: 'All appointments for this session are booked'
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

    console.log("======== userRole ===  11111 =========== " + userRole);

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
      timeSlotConfigId: timeSlotConfig._id, // Store reference to TimeSlotConfig
      appointmentNumber: nextAppointmentNumber,
      estimatedTime,
      status: 'scheduled',
      symptoms: symptoms || undefined,
      isPaid: false,
      isPatientVisited: false,
      patientName,
      patientPhone,
      patientEmail,
      transactionId,
      fees: processedFees,
      bookedUser,
      bookedBy,
      // Payment fields
      paymentMethod: paymentMethod || 'cash',
      paymentStatus: paymentStatus || (paymentMethod === 'online' ? 'pending' : 'not_required'),
      paymentGateway: paymentMethod === 'online' ? 'dialog_genie' : null,
      smsDelivery: {
        status: 'pending',
        lastUpdated: new Date()
      }
    });

    await booking.save();
    console.log("Booking created successfully:", booking);

    // Send FCM notification (token from environment)
    const fcmTokenFromEnv = process.env.FCM_TOKEN;
    if (fcmTokenFromEnv) {
      const smsMessage = `Hi ${patientName}, your booking is confirmed for ${parsedBookingDate.toDateString()} at ${estimatedTime}. Doctor ID: ${doctorId}. Thank you for using MyClinic!`;

      // await fcmServerClient.sendNotification(
      //   fcmTokenFromEnv,
      //   'Booking Created',
      //   'New booking created — ready to send SMS',
      //   {
      //     phone: patientPhone,
      //     message: smsMessage,
      //     bookingId: booking._id.toString(),
      //     date: parsedBookingDate.toISOString(),
      //     doctorId: doctorId.toString(),
      //   }
      // );

      console.log("✅ FCM notification with booking details sent");
    } else {
      console.warn('⚠️ FCM_TOKEN not set in environment, skipping notification');
    }

    // Send SMS notification (non-blocking)
    // Only send SMS immediately for cash payments
    // For online payments, SMS will be sent after successful payment via paymentRoutes.js
    const shouldSendSmsNow = !paymentMethod || paymentMethod === 'cash';

    if (patientPhone && shouldSendSmsNow) {
      try {
        console.log("📨 Sending booking confirmation SMS (cash payment)...");
        smsService.sendBookingConfirmationSMS(booking).then(smsResult => {
          if (smsResult && smsResult.success) {
            console.log("✅ Booking confirmation SMS sent successfully");

            booking.smsDelivery.status = 'sent';
            booking.smsDelivery.sentAt = new Date();
            booking.smsDelivery.lastUpdated = new Date();

            if (smsResult.response && smsResult.response.transaction_id) {
              booking.smsDelivery.details = `TransID: ${smsResult.response.transaction_id}`;
            }

            booking.save();
          } else {
            console.warn("⚠️ Failed to send booking confirmation SMS");
            booking.smsDelivery.status = 'failed';
            booking.save();
          }
        }).catch(err => {
          console.error("❌ Error initiating SMS send:", err);
        });
      } catch (smsError) {
        console.error("❌ Error in SMS flow:", smsError);
      }
    } else if (paymentMethod === 'online') {
      console.log("📱 Online payment selected - SMS will be sent after payment success");
    }

    // Return successful booking response
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
    console.log('Update booking status:', req.body);

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

    // 1. Get the regular time slot configurations for this day
    const timeSlotConfigsForDay = await TimeSlotConfig.find({ doctorId, dispensaryId, dayOfWeek }).sort({ startTime: 1 });
    const timeSlotConfig = timeSlotConfigsForDay.length > 0 ? timeSlotConfigsForDay[0] : null;

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
        _id: booking.doctorId._id,
        doctorId: booking.doctorId._id,
        name: booking.doctorId.name,
        specialization: booking.doctorId.specialization
      },
      dispensary: {
        _id: booking.dispensaryId._id,
        dispensaryId: booking.dispensaryId._id,
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

// User self-service amend: change date/time only (same doctor/dispensary)
router.patch('/:id/user-amend', validateCustomJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, appointmentNumber: requestedNumber } = req.body;

    if (!newDate) {
      return res.status(400).json({ message: 'newDate is required' });
    }

    const existingBooking = await Booking.findById(id);
    if (!existingBooking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify ownership
    const userId = req.user.userId || req.user.id;
    if (existingBooking.patientEmail !== req.user.email &&
      existingBooking.bookedUser !== userId &&
      existingBooking.bookedUser !== req.user.email) {
      return res.status(403).json({ message: 'Not authorized to amend this booking' });
    }

    if (existingBooking.status !== 'scheduled') {
      return res.status(400).json({ message: 'Only scheduled bookings can be amended' });
    }

    // 24-hour check based on current appointment time
    const [estH, estM] = existingBooking.estimatedTime.split(':').map(Number);
    const apptDateTime = new Date(existingBooking.bookingDate);
    apptDateTime.setHours(estH, estM, 0, 0);
    if (apptDateTime.getTime() - Date.now() < 24 * 60 * 60 * 1000) {
      return res.status(400).json({ message: 'Cannot amend booking within 24 hours of appointment' });
    }

    // Use same doctor/dispensary
    const doctorId = existingBooking.doctorId;
    const dispensaryId = existingBooking.dispensaryId;

    const parsedDate = new Date(newDate);
    const dayOfWeek = parsedDate.getDay();

    const configs = await TimeSlotConfig.find({ doctorId, dispensaryId, dayOfWeek }).sort({ startTime: 1 });
    const timeSlotConfig = configs.length > 0 ? configs[0] : null;
    if (!timeSlotConfig) {
      return res.status(400).json({ message: 'Doctor has no session on the selected day' });
    }

    const startOfDay = new Date(parsedDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(parsedDate); endOfDay.setHours(23, 59, 59, 999);

    // Check date range absence
    const dateRangeAbsent = await AbsentTimeSlot.findOne({
      doctorId, dispensaryId, isDateRange: true,
      startDate: { $lte: endOfDay }, endDate: { $gte: startOfDay }
    });
    if (dateRangeAbsent) {
      return res.status(400).json({ message: 'Doctor is not available on the selected date' });
    }

    const absentSlot = await AbsentTimeSlot.findOne({
      doctorId, dispensaryId, isDateRange: { $ne: true },
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (absentSlot && !absentSlot.isModifiedSession) {
      return res.status(400).json({ message: 'Doctor is not available on the selected date' });
    }

    let startTime, maxPatients, minutesPerPatient;
    if (absentSlot && absentSlot.isModifiedSession) {
      startTime = absentSlot.startTime;
      maxPatients = absentSlot.maxPatients || timeSlotConfig.maxPatients;
      minutesPerPatient = absentSlot.minutesPerPatient || timeSlotConfig.minutesPerPatient;
    } else {
      startTime = timeSlotConfig.startTime;
      maxPatients = timeSlotConfig.maxPatients;
      minutesPerPatient = timeSlotConfig.minutesPerPatient || 15;
    }

    const existingBookings = await Booking.find({
      _id: { $ne: id },
      doctorId, dispensaryId,
      bookingDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    }).sort({ appointmentNumber: 1 });

    if (existingBookings.length >= maxPatients) {
      return res.status(400).json({ message: 'All appointments for the selected date are booked' });
    }

    const bookedNumbers = new Set(existingBookings.map(b => b.appointmentNumber));

    // Use requested appointment number if provided and available, otherwise next available
    let nextNumber;
    if (requestedNumber && !bookedNumbers.has(requestedNumber) && requestedNumber <= maxPatients) {
      nextNumber = requestedNumber;
    } else {
      nextNumber = 1;
      while (bookedNumbers.has(nextNumber) && nextNumber <= maxPatients) nextNumber++;
    }

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const appointmentOffset = (nextNumber - 1) * minutesPerPatient;
    const appointmentDateTime = new Date(parsedDate);
    appointmentDateTime.setHours(startHour, startMinute, 0, 0);
    appointmentDateTime.setMinutes(appointmentDateTime.getMinutes() + appointmentOffset);

    const estimatedHours = appointmentDateTime.getHours().toString().padStart(2, '0');
    const estimatedMinutes = appointmentDateTime.getMinutes().toString().padStart(2, '0');
    const estimatedTime = `${estimatedHours}:${estimatedMinutes}`;

    const endOfAppointment = new Date(appointmentDateTime);
    endOfAppointment.setMinutes(endOfAppointment.getMinutes() + minutesPerPatient);
    const endHours = endOfAppointment.getHours().toString().padStart(2, '0');
    const endMinutes = endOfAppointment.getMinutes().toString().padStart(2, '0');
    const timeSlot = `${estimatedHours}:${estimatedMinutes}-${endHours}:${endMinutes}`;

    const updatedBooking = await Booking.findByIdAndUpdate(id, {
      bookingDate: parsedDate,
      timeSlot,
      appointmentNumber: nextNumber,
      estimatedTime
    }, { new: true, runValidators: true })
      .populate('doctorId', 'name specialization')
      .populate('dispensaryId', 'name address');

    if (!updatedBooking) {
      return res.status(500).json({ message: 'Failed to update booking' });
    }

    res.status(200).json({ message: 'Booking amended successfully', booking: updatedBooking });
  } catch (error) {
    console.error('Error amending booking:', error);
    res.status(500).json({ message: 'Error amending booking', error: error.message });
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
    const adjustConfigs = await TimeSlotConfig.find({
      doctorId: doctorId || existingBooking.doctorId,
      dispensaryId: dispensaryId || existingBooking.dispensaryId,
      dayOfWeek
    }).sort({ startTime: 1 });
    const timeSlotConfig = adjustConfigs.length > 0 ? adjustConfigs[0] : null;

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

// SMS Delivery Status Update Endpoint
router.post('/sms-delivery-status', async (req, res) => {
  try {
    const { bookingId, status, details, timestamp } = req.body;

    // Validate required fields
    if (!bookingId || !status) {
      return res.status(400).json({
        message: 'bookingId and status are required'
      });
    }

    // Validate status enum
    const validStatuses = ['sent', 'delivered', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status. Must be one of: sent, delivered, failed'
      });
    }

    // Find the booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.error(`SMS Delivery Update Failed: Booking not found for ID ${bookingId}`);
      return res.status(404).json({
        message: 'Booking not found'
      });
    }

    // Update SMS delivery status
    const updateData = {
      'smsDelivery.status': status,
      'smsDelivery.details': details || booking.smsDelivery?.details,
      'smsDelivery.lastUpdated': new Date()
    };

    // Set specific timestamp based on status
    if (status === 'sent') {
      updateData['smsDelivery.sentAt'] = timestamp ? new Date(timestamp) : new Date();
    } else if (status === 'delivered') {
      updateData['smsDelivery.deliveredAt'] = timestamp ? new Date(timestamp) : new Date();
    } else if (status === 'failed') {
      updateData['smsDelivery.failedAt'] = timestamp ? new Date(timestamp) : new Date();
    }

    // Update the booking
    const updatedBooking = await Booking.findByIdAndUpdate(
      bookingId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedBooking) {
      console.error(`SMS Delivery Update Failed: Could not update booking ${bookingId}`);
      return res.status(500).json({
        message: 'Failed to update booking SMS delivery status'
      });
    }

    console.log(`SMS Delivery Status Updated: Booking ${bookingId} - Status: ${status}`);

    res.json({
      message: 'SMS delivery status updated successfully',
      bookingId: updatedBooking._id,
      transactionId: updatedBooking.transactionId,
      smsDelivery: updatedBooking.smsDelivery
    });

  } catch (error) {
    console.error('SMS Delivery Status Update Error:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    res.status(500).json({
      message: 'Internal server error updating SMS delivery status',
      error: error.message
    });
  }
});

module.exports = router;

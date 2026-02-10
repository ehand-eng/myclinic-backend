const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Doctor = require('../models/Doctor');
const TimeSlotConfig = require('../models/TimeSlotConfig');
const AbsentTimeSlot = require('../models/AbsentTimeSlot');
const { validateCustomJwt } = require('../middleware/customAuthMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const QueueStatus = require('../models/QueueStatus');
const mongoose = require('mongoose');
const admin = require('../config/firebase');

// Helper function to get user's dispensary IDs
const getUserDispensaryIds = (user) => {
  if (!user || !user.dispensaryIds) {
    return [];
  }
  return user.dispensaryIds.map(id => id.toString ? id.toString() : id);
};

// Middleware to check if user is dispensary-admin or dispensary-staff
const requireDispensaryAccess = (req, res, next) => {
  const userRole = req.user?.role?.toLowerCase() || '';
  const allowedRoles = ['dispensary-admin', 'dispensary-staff'];

  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({
      message: 'Access denied',
      error: 'Only dispensary-admin and dispensary-staff can access this feature'
    });
  }

  next();
};

// Middleware to validate booking belongs to user's dispensary
const validateBookingDispensary = async (req, res, next) => {
  try {
    const bookingId = req.params.bookingId || req.body.bookingId;
    if (!bookingId) {
      return next(); // Let route handle missing ID
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const userDispensaryIds = getUserDispensaryIds(req.user);
    const bookingDispensaryId = booking.dispensaryId.toString();

    if (!userDispensaryIds.includes(bookingDispensaryId)) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'Booking does not belong to your dispensary'
      });
    }

    req.booking = booking;
    next();
  } catch (error) {
    console.error('Error validating booking dispensary:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Search bookings
// GET /api/dispensary/bookings/search
router.get('/bookings/search', validateCustomJwt, requireDispensaryAccess, async (req, res) => {
  try {
    const {
      bookingReference,
      appointmentNumber,
      patientName,
      patientPhone,
      doctorId,
      sessionId,
      date,
      dispensaryId
    } = req.query;

    const userDispensaryIds = getUserDispensaryIds(req.user);
    console.log("++++++++++++++ userDispensaryIds ++++++++++++++", userDispensaryIds);
    // Build search criteria
    const searchCriteria = {
      dispensaryId: { $in: userDispensaryIds.map(id => new mongoose.Types.ObjectId(id)) }
    };

    // If dispensaryId is provided, validate it belongs to user
    if (dispensaryId) {
      if (!userDispensaryIds.includes(dispensaryId)) {
        return res.status(403).json({
          message: 'Access denied',
          error: 'Dispensary does not belong to your assigned dispensaries'
        });
      }
      searchCriteria.dispensaryId = new mongoose.Types.ObjectId(dispensaryId);
    }

    // Add date filter if provided
    if (date) {
      // Parse date string to avoid timezone issues
      // Date format: YYYY-MM-DD
      const [year, month, day] = date.split('-').map(Number);
      const startDate = new Date(year, month - 1, day, 0, 0, 0, 0); // month is 0-indexed
      const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
      searchCriteria.bookingDate = { $gte: startDate, $lte: endDate };
    }

    // Add doctor filter if provided
    if (doctorId) {
      searchCriteria.doctorId = new mongoose.Types.ObjectId(doctorId);
    }

    // Add search criteria (at least one required)
    const searchConditions = [];

    if (bookingReference) {
      searchConditions.push({ transactionId: { $regex: bookingReference, $options: 'i' } });
    }

    if (appointmentNumber) {
      searchConditions.push({ appointmentNumber: parseInt(appointmentNumber) });
    }

    if (patientName) {
      searchConditions.push({ patientName: { $regex: patientName, $options: 'i' } });
    }

    if (patientPhone) {
      searchConditions.push({ patientPhone: { $regex: patientPhone, $options: 'i' } });
    }

    if (searchConditions.length > 0) {
      searchCriteria.$or = searchConditions;
    } else if (!date && !doctorId) {
      // If no search criteria provided, return empty result
      return res.status(400).json({
        message: 'At least one search parameter is required',
        required: ['bookingReference', 'appointmentNumber', 'patientName', 'patientPhone'],
        optional: ['doctorId', 'date', 'dispensaryId']
      });
    }
    console.log("++++++++++++++ searchCriteria ++++++++++++++", searchCriteria);
    // Add session filter if provided
    // sessionId can be timeSlotConfigId (ObjectId) or timeSlot (string) for backward compatibility
    if (sessionId && sessionId !== "all") {
      if (mongoose.Types.ObjectId.isValid(sessionId)) {
        // It's a timeSlotConfigId
        searchCriteria.timeSlotConfigId = new mongoose.Types.ObjectId(sessionId);
      } else {
        // Fallback: treat as timeSlot string (for backward compatibility)
        searchCriteria.timeSlot = sessionId;
      }
    }
    console.log("++++++++++++++ searchCriteria ++++++++++++++", searchCriteria);
    const bookings = await Booking.find(searchCriteria)
      .populate('doctorId', 'name specialization')
      .populate('dispensaryId', 'name address')
      .sort({ bookingDate: 1, appointmentNumber: 1 })
      .lean();

    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      transactionId: booking.transactionId,
      appointmentNumber: booking.appointmentNumber,
      patientName: booking.patientName,
      patientPhone: booking.patientPhone,
      patientEmail: booking.patientEmail,
      doctor: {
        id: booking.doctorId?._id?.toString(),
        name: booking.doctorId?.name || 'Unknown',
        specialization: booking.doctorId?.specialization || 'Unknown'
      },
      dispensary: {
        id: booking.dispensaryId?._id?.toString(),
        name: booking.dispensaryId?.name || 'Unknown',
        address: booking.dispensaryId?.address || 'Unknown'
      },
      bookingDate: booking.bookingDate,
      timeSlot: booking.timeSlot,
      estimatedTime: booking.estimatedTime,
      status: booking.status,
      checkedInTime: booking.checkedInTime,
      symptoms: booking.symptoms,
      notes: booking.notes,
      isPaid: booking.isPaid,
      isPatientVisited: booking.isPatientVisited
    }));

    res.status(200).json({
      message: 'Bookings retrieved successfully',
      count: formattedBookings.length,
      bookings: formattedBookings
    });

  } catch (error) {
    console.error('Error searching bookings:', error);
    res.status(500).json({ message: 'Error searching bookings', error: error.message });
  }
});

// Load bookings for a session (walk-in/bulk mode)
// GET /api/dispensary/bookings/session
router.get('/bookings/session', validateCustomJwt, requireDispensaryAccess, async (req, res) => {
  try {
    const { dispensaryId, doctorId, sessionId, date } = req.query;

    // Validate required parameters
    if (!dispensaryId || !doctorId || !date) {
      return res.status(400).json({
        message: 'Missing required parameters',
        required: ['dispensaryId', 'doctorId', 'date'],
        optional: ['sessionId']
      });
    }
    console.log("++++++++++++++ dispensaryId ++++++++++++++", dispensaryId);
    const userDispensaryIds = getUserDispensaryIds(req.user);

    // Validate dispensary belongs to user
    if (!userDispensaryIds.includes(dispensaryId)) {
      return res.status(403).json({
        message: 'Access denied',
        error: 'Dispensary does not belong to your assigned dispensaries'
      });
    }

    // Build date range - parse date string to avoid timezone issues
    // Date format: YYYY-MM-DD
    const [year, month, day] = date.split('-').map(Number);
    const startDate = new Date(year, month - 1, day, 0, 0, 0, 0); // month is 0-indexed
    const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
    console.log("++++++++++++++ startDate ++++++++++++++", startDate);
    // Build search criteria
    const searchCriteria = {
      dispensaryId: new mongoose.Types.ObjectId(dispensaryId),
      doctorId: new mongoose.Types.ObjectId(doctorId),
      bookingDate: { $gte: startDate, $lte: endDate }
    };

    // Add session filter if provided
    // sessionId is now timeSlotConfigId (not timeSlot string)
    if (sessionId && sessionId !== "all") {
      // Check if it's a valid ObjectId (timeSlotConfigId) or fallback to timeSlot for backward compatibility
      if (mongoose.Types.ObjectId.isValid(sessionId)) {
        searchCriteria.timeSlotConfigId = new mongoose.Types.ObjectId(sessionId);
      } else {
        // Fallback: if it's not a valid ObjectId, treat it as timeSlot (for backward compatibility)
        searchCriteria.timeSlot = sessionId;
      }
    }
    console.log("+++1111111+++++++++++ searchCriteria ++++++++++++++", searchCriteria);
    const bookings = await Booking.find(searchCriteria)
      .populate('doctorId', 'name specialization')
      .populate('dispensaryId', 'name address')
      .sort({ appointmentNumber: 1 })
      .lean();
    console.log("----------------- bookings ++++++++++++++", bookings);
    const formattedBookings = bookings.map(booking => ({
      _id: booking._id,
      transactionId: booking.transactionId,
      appointmentNumber: booking.appointmentNumber,
      patientName: booking.patientName,
      patientPhone: booking.patientPhone,
      patientEmail: booking.patientEmail,
      doctor: {
        id: booking.doctorId?._id?.toString(),
        name: booking.doctorId?.name || 'Unknown',
        specialization: booking.doctorId?.specialization || 'Unknown'
      },
      dispensary: {
        id: booking.dispensaryId?._id?.toString(),
        name: booking.dispensaryId?.name || 'Unknown',
        address: booking.dispensaryId?.address || 'Unknown'
      },
      bookingDate: booking.bookingDate,
      timeSlot: booking.timeSlot,
      estimatedTime: booking.estimatedTime,
      status: booking.status,
      checkedInTime: booking.checkedInTime,
      symptoms: booking.symptoms,
      notes: booking.notes,
      isPaid: booking.isPaid,
      isPatientVisited: booking.isPatientVisited
    }));

    res.status(200).json({
      message: 'Bookings retrieved successfully',
      count: formattedBookings.length,
      bookings: formattedBookings
    });

  } catch (error) {
    console.error('Error loading session bookings:', error);
    res.status(500).json({ message: 'Error loading session bookings', error: error.message });
  }
});

// Mark booking as checked-in
// PATCH /api/dispensary/bookings/:bookingId/check-in
router.patch('/bookings/:bookingId/check-in', validateCustomJwt, requireDispensaryAccess, validateBookingDispensary, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = req.booking;

    // Check if already checked in
    if (booking.status === 'checked_in' || booking.isPatientVisited) {
      return res.status(400).json({
        message: 'Booking already checked in',
        checkedInTime: booking.checkedInTime
      });
    }

    // Update booking status
    booking.status = 'checked_in';
    booking.checkedInTime = new Date();
    booking.isPatientVisited = true;

    await booking.save();

    // Update Queue Status (Ongoing Number)
    try {
      const todayDate = new Date().toISOString().split('T')[0];
      const dispensaryIdStr = booking.dispensaryId.toString();
      const doctorIdStr = booking.doctorId.toString();

      await QueueStatus.findOneAndUpdate(
        {
          dispensaryId: booking.dispensaryId,
          doctorId: booking.doctorId,
          date: todayDate
        },
        {
          currentNumber: booking.appointmentNumber,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );

      // Emit WebSocket event using ws
      const wss = req.app.get('wss');
      if (wss && wss.broadcastToRoom) {
        const updateEvent = {
          type: 'ONGOING_NUMBER_UPDATE',
          payload: {
            dispensaryId: dispensaryIdStr,
            doctorId: doctorIdStr,
            ongoingNumber: booking.appointmentNumber,
            timestamp: new Date()
          }
        };
        wss.broadcastToRoom(dispensaryIdStr, doctorIdStr, updateEvent);
      }

      // Send FCM Notification
      try {
        const topic = `queue_${dispensaryIdStr}_${doctorIdStr}`;
        const message = {
          topic: topic,
          notification: {
            title: 'Queue Update',
            body: `Current Token: ${booking.appointmentNumber}`
          },
          data: {
            type: 'ONGOING_NUMBER_UPDATE',
            dispensaryId: dispensaryIdStr,
            doctorId: doctorIdStr,
            ongoingNumber: String(booking.appointmentNumber),
            timestamp: new Date().toISOString()
          },
          android: {
            priority: 'high',
            notification: {
              channelId: 'queue_updates', // Create this channel in React Native
            }
          }
        };

        await admin.messaging().send(message);
        console.log(`FCM sent to topic: ${topic}`);
      } catch (fcmError) {
        console.error('Error sending FCM:', fcmError.message);
      }
    } catch (queueError) {
      console.error('Error updating queue status:', queueError);
      // Don't fail the request if queue update fails, just log it
    }

    // Return updated booking
    const updatedBooking = await Booking.findById(bookingId)
      .populate('doctorId', 'name specialization')
      .populate('dispensaryId', 'name address')
      .lean();

    const formattedBooking = {
      _id: updatedBooking._id,
      transactionId: updatedBooking.transactionId,
      appointmentNumber: updatedBooking.appointmentNumber,
      patientName: updatedBooking.patientName,
      patientPhone: updatedBooking.patientPhone,
      patientEmail: updatedBooking.patientEmail,
      doctor: {
        id: updatedBooking.doctorId?._id?.toString(),
        name: updatedBooking.doctorId?.name || 'Unknown',
        specialization: updatedBooking.doctorId?.specialization || 'Unknown'
      },
      dispensary: {
        id: updatedBooking.dispensaryId?._id?.toString(),
        name: updatedBooking.dispensaryId?.name || 'Unknown',
        address: updatedBooking.dispensaryId?.address || 'Unknown'
      },
      bookingDate: updatedBooking.bookingDate,
      timeSlot: updatedBooking.timeSlot,
      estimatedTime: updatedBooking.estimatedTime,
      status: updatedBooking.status,
      checkedInTime: updatedBooking.checkedInTime,
      symptoms: updatedBooking.symptoms,
      notes: updatedBooking.notes,
      isPaid: updatedBooking.isPaid,
      isPatientVisited: updatedBooking.isPatientVisited
    };

    res.status(200).json({
      message: 'Booking checked in successfully',
      booking: formattedBooking
    });

  } catch (error) {
    console.error('Error checking in booking:', error);
    res.status(500).json({ message: 'Error checking in booking', error: error.message });
  }
});

// Get current queue status (ongoing number)
// GET /api/dispensary/queue-status
router.get('/queue-status', validateCustomJwt, async (req, res) => {
  try {
    const { dispensaryId, doctorId, date } = req.query;

    if (!dispensaryId || !doctorId) {
      return res.status(400).json({ message: 'DispensaryId and DoctorId are required' });
    }

    const queryDate = date || new Date().toISOString().split('T')[0];

    // Find current status
    const status = await QueueStatus.findOne({
      dispensaryId: new mongoose.Types.ObjectId(dispensaryId),
      doctorId: new mongoose.Types.ObjectId(doctorId),
      date: queryDate
    });

    res.json({
      ongoingNumber: status ? status.currentNumber : 0,
      lastUpdated: status ? status.lastUpdated : null
    });
  } catch (error) {
    console.error('Error fetching queue status:', error);
    res.status(500).json({ message: 'Error fetching queue status' });
  }
});

// Manually update queue status
// POST /api/dispensary/queue-status/update
router.post('/queue-status/update', validateCustomJwt, requireDispensaryAccess, async (req, res) => {
  try {
    const { dispensaryId, doctorId, ongoingNumber, date } = req.body;

    if (!dispensaryId || !doctorId || ongoingNumber === undefined) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    // Verify access
    const userDispensaryIds = getUserDispensaryIds(req.user);
    if (!userDispensaryIds.includes(dispensaryId)) {
      return res.status(403).json({ message: 'Access denied to this dispensary' });
    }

    const updateDate = date || new Date().toISOString().split('T')[0];

    // Update DB
    const status = await QueueStatus.findOneAndUpdate(
      {
        dispensaryId: new mongoose.Types.ObjectId(dispensaryId),
        doctorId: new mongoose.Types.ObjectId(doctorId),
        date: updateDate
      },
      {
        currentNumber: ongoingNumber,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    // Emit WebSocket Event using ws
    const wss = req.app.get('wss');
    if (wss && wss.broadcastToRoom) {
      const dispensaryIdStr = dispensaryId.toString();
      const doctorIdStr = doctorId.toString();

      const updateEvent = {
        type: 'ONGOING_NUMBER_UPDATE',
        payload: {
          dispensaryId: dispensaryIdStr,
          doctorId: doctorIdStr,
          ongoingNumber: Number(ongoingNumber),
          timestamp: new Date()
        }
      };

      wss.broadcastToRoom(dispensaryIdStr, doctorIdStr, updateEvent);
    }

    // Send FCM Notification
    try {
      const topic = `queue_${dispensaryIdStr}_${doctorIdStr}`;
      const message = {
        topic: topic,
        notification: {
          title: 'Queue Update',
          body: `Current Token: ${ongoingNumber}`
        },
        data: {
          type: 'ONGOING_NUMBER_UPDATE',
          dispensaryId: dispensaryIdStr,
          doctorId: doctorIdStr,
          ongoingNumber: String(ongoingNumber),
          timestamp: new Date().toISOString()
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'queue_updates',
          }
        }
      };

      await admin.messaging().send(message);
      console.log(`FCM sent to topic: ${topic}`);
    } catch (fcmError) {
      console.error('Error sending FCM:', fcmError.message);
    }

    res.json({
      message: 'Queue updated successfully',
      ongoingNumber: status.currentNumber
    });

  } catch (error) {
    console.error('Error updating queue status:', error);
    res.status(500).json({ message: 'Error updating queue status' });
  }
});

module.exports = router;


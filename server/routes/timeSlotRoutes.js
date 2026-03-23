const express = require('express');
const router = express.Router();
const TimeSlotConfig = require('../models/TimeSlotConfig');
const AbsentTimeSlot = require('../models/AbsentTimeSlot');
const Doctor = require('../models/Doctor');
const Dispensary = require('../models/Dispensary');
const DoctorDispensary = require('../models/DoctorDispensary');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');
const { validateJwt, requireRole, ROLES } = require('../middleware/authMiddleware');

// Get time slots for a doctor at a specific dispensary
router.get('/config/doctor/:doctorId/dispensary/:dispensaryId', async (req, res) => {
  try {
    const { doctorId, dispensaryId } = req.params;

    const timeSlots = await TimeSlotConfig.find({
      doctorId: doctorId,
      dispensaryId: dispensaryId
    });

    res.status(200).json(timeSlots);
  } catch (error) {
    console.error('Error getting time slots:', error);
    res.status(500).json({ message: 'Error fetching time slots', error: error.message });
  }
});

// Get all time slots for a dispensary
router.get('/config/dispensary/:dispensaryId', async (req, res) => {
  try {
    const timeSlots = await TimeSlotConfig.find({
      dispensaryId: req.params.dispensaryId
    }).populate('doctorId', 'name');

    res.status(200).json(timeSlots);
  } catch (error) {
    console.error('Error getting dispensary time slots:', error);
    res.status(500).json({ message: 'Error fetching time slots', error: error.message });
  }
});

// Add a new time slot configuration
router.post('/config', async (req, res) => {
  try {
    const timeSlotConfig = new TimeSlotConfig(req.body);
    await timeSlotConfig.save();
    res.status(201).json(timeSlotConfig);
  } catch (error) {
    console.error('Error creating time slot config:', error);
    res.status(500).json({ message: 'Error creating time slot config', error: error.message });
  }
});

// Update a time slot configuration
router.put('/config/:id', async (req, res) => {
  try {
    const timeSlotConfig = await TimeSlotConfig.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!timeSlotConfig) {
      return res.status(404).json({ message: 'Time slot configuration not found' });
    }

    res.status(200).json(timeSlotConfig);
  } catch (error) {
    console.error('Error updating time slot config:', error);
    res.status(500).json({ message: 'Error updating time slot config', error: error.message });
  }
});

// Delete a time slot configuration
router.delete('/config/:id', async (req, res) => {
  try {
    const timeSlotConfig = await TimeSlotConfig.findByIdAndDelete(req.params.id);

    if (!timeSlotConfig) {
      return res.status(404).json({ message: 'Time slot configuration not found' });
    }

    res.status(200).json({ message: 'Time slot configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting time slot config:', error);
    res.status(500).json({ message: 'Error deleting time slot config', error: error.message });
  }
});

// Get sessions (start times) for a specific date
// Returns all configured sessions for doctor + dispensary + dayOfWeek, considering AbsentTimeSlot modifications
router.get('/sessions/:doctorId/:dispensaryId/:date', async (req, res) => {
  try {
    const { doctorId, dispensaryId, date } = req.params;

    // Parse the date - ensure we use local timezone, not UTC
    // Date format: YYYY-MM-DD
    const [year, month, day] = date.split('-').map(Number);
    const bookingDate = new Date(year, month - 1, day); // month is 0-indexed
    const dayOfWeek = bookingDate.getDay(); // 0-6 (Sunday-Saturday)
    console.log("++++++++++++++ dayOfWeek ++++++++++++++", dayOfWeek);
    console.log("++++++++++++++ doctorId ++++++++++++++", doctorId);
    console.log("++++++++++++++ dispensaryId ++++++++++++++", dispensaryId);
    // Get all time slot configurations for this doctor + dispensary + dayOfWeek
    const timeSlotConfigs = await TimeSlotConfig.find({
      doctorId: doctorId,
      dispensaryId: dispensaryId,
      dayOfWeek: dayOfWeek
    }).sort({ startTime: 1 }); // Sort by start time
    console.log("++++++++++++++ timeSlotConfigs ++++++++++++++", timeSlotConfigs);
    if (!timeSlotConfigs || timeSlotConfigs.length === 0) {
      return res.status(200).json({
        sessions: [],
        message: 'No sessions configured for this day'
      });
    }

    // Check for AbsentTimeSlot modifications for this specific date
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const absentSlot = await AbsentTimeSlot.findOne({
      doctorId: doctorId,
      dispensaryId: dispensaryId,
      isDateRange: { $ne: true },
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // Check date-range absences
    const dateRangeAbsent = await AbsentTimeSlot.findOne({
      doctorId: doctorId,
      dispensaryId: dispensaryId,
      isDateRange: true,
      startDate: { $lte: bookingDate },
      endDate: { $gte: bookingDate }
    });

    // If doctor is completely absent (single date or date range), return empty
    if (dateRangeAbsent) {
      return res.status(200).json({
        sessions: [],
        message: 'Doctor is absent on this date'
      });
    }
    if (absentSlot && !absentSlot.isModifiedSession) {
      return res.status(200).json({
        sessions: [],
        message: 'Doctor is absent on this date'
      });
    }

    // Build sessions list
    const sessions = [];

    if (absentSlot && absentSlot.isModifiedSession) {
      // Use modified session instead of regular config
      // Still reference the original timeSlotConfigId if available (use first one as fallback)
      const baseConfigId = timeSlotConfigs.length > 0 ? timeSlotConfigs[0]._id : null;
      sessions.push({
        startTime: absentSlot.startTime,
        endTime: absentSlot.endTime,
        timeSlot: `${absentSlot.startTime}-${absentSlot.endTime}`,
        timeSlotConfigId: baseConfigId ? baseConfigId.toString() : null,
        isModified: true
      });
    } else {
      // Use regular time slot configs
      for (const config of timeSlotConfigs) {
        sessions.push({
          startTime: config.startTime,
          endTime: config.endTime,
          timeSlot: `${config.startTime}-${config.endTime}`,
          timeSlotConfigId: config._id.toString(),
          isModified: false
        });
      }
    }

    res.status(200).json({
      sessions: sessions,
      date: date,
      dayOfWeek: dayOfWeek
    });

  } catch (error) {
    console.error('Error getting sessions:', error);
    res.status(500).json({ message: 'Error fetching sessions', error: error.message });
  }
});

// Get absent time slots (both single-date and date-range)
router.get('/absent/doctor/:doctorId/dispensary/:dispensaryId', async (req, res) => {
  try {
    const { doctorId, dispensaryId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const queryStart = new Date(startDate);
    const queryEnd = new Date(endDate);

    // Fetch single-date entries within the range
    const singleDateSlots = await AbsentTimeSlot.find({
      doctorId,
      dispensaryId,
      isDateRange: { $ne: true },
      date: { $gte: queryStart, $lte: queryEnd }
    });

    // Fetch date-range entries that overlap with the query range
    const dateRangeSlots = await AbsentTimeSlot.find({
      doctorId,
      dispensaryId,
      isDateRange: true,
      startDate: { $lte: queryEnd },
      endDate: { $gte: queryStart }
    });

    res.status(200).json([...singleDateSlots, ...dateRangeSlots]);
  } catch (error) {
    console.error('Error getting absent time slots:', error);
    res.status(500).json({ message: 'Error fetching absent time slots', error: error.message });
  }
});

// Get disabled dates for a doctor-dispensary pair (for online booking calendar)
router.get('/absent/disabled-dates/:doctorId/:dispensaryId', async (req, res) => {
  try {
    const { doctorId, dispensaryId } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get single-date full absences (not modified sessions) from today onwards
    const singleAbsences = await AbsentTimeSlot.find({
      doctorId,
      dispensaryId,
      isDateRange: { $ne: true },
      isModifiedSession: false,
      date: { $gte: today }
    });

    // Get date-range absences that haven't ended yet
    const rangeAbsences = await AbsentTimeSlot.find({
      doctorId,
      dispensaryId,
      isDateRange: true,
      endDate: { $gte: today }
    });

    const disabledDates = [];

    // Add single-date absences
    for (const slot of singleAbsences) {
      const d = new Date(slot.date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      disabledDates.push(`${year}-${month}-${day}`);
    }

    // Expand date ranges into individual dates
    for (const slot of rangeAbsences) {
      const start = new Date(Math.max(slot.startDate.getTime(), today.getTime()));
      start.setHours(0, 0, 0, 0);
      const end = new Date(slot.endDate);
      end.setHours(0, 0, 0, 0);

      const current = new Date(start);
      while (current <= end) {
        const year = current.getFullYear();
        const month = String(current.getMonth() + 1).padStart(2, '0');
        const day = String(current.getDate()).padStart(2, '0');
        disabledDates.push(`${year}-${month}-${day}`);
        current.setDate(current.getDate() + 1);
      }
    }

    res.status(200).json({ disabledDates: [...new Set(disabledDates)] });
  } catch (error) {
    console.error('Error getting disabled dates:', error);
    res.status(500).json({ message: 'Error fetching disabled dates', error: error.message });
  }
});

// Check conflicts for a date range absence
router.get('/absent/date-range/check-conflicts', async (req, res) => {
  try {
    const { doctorId, dispensaryId, startDate, endDate } = req.query;

    if (!doctorId || !dispensaryId || !startDate || !endDate) {
      return res.status(400).json({ message: 'doctorId, dispensaryId, startDate, and endDate are required' });
    }

    const rangeStart = new Date(startDate);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(endDate);
    rangeEnd.setHours(23, 59, 59, 999);

    // Check for overlapping date-range absences
    const overlapping = await AbsentTimeSlot.find({
      doctorId,
      dispensaryId,
      isDateRange: true,
      startDate: { $lte: rangeEnd },
      endDate: { $gte: rangeStart }
    });

    if (overlapping.length > 0) {
      return res.status(200).json({
        hasOverlap: true,
        overlappingAbsences: overlapping,
        message: 'There are overlapping absence records in this date range'
      });
    }

    // Check for existing bookings in the date range
    const conflictingBookings = await Booking.find({
      doctorId,
      dispensaryId,
      bookingDate: { $gte: rangeStart, $lte: rangeEnd },
      status: { $nin: ['cancelled'] }
    }).select('patientName patientPhone bookingDate estimatedTime appointmentNumber status transactionId').lean();

    res.status(200).json({
      hasOverlap: false,
      bookingCount: conflictingBookings.length,
      bookings: conflictingBookings
    });
  } catch (error) {
    console.error('Error checking date range conflicts:', error);
    res.status(500).json({ message: 'Error checking conflicts', error: error.message });
  }
});

// Create a date range absence
router.post('/absent/date-range', async (req, res) => {
  try {
    const { doctorId, dispensaryId, startDate, endDate, reason, force } = req.body;

    if (!doctorId || !dispensaryId || !startDate || !endDate) {
      return res.status(400).json({ message: 'doctorId, dispensaryId, startDate, and endDate are required' });
    }

    const rangeStart = new Date(startDate);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(endDate);
    rangeEnd.setHours(23, 59, 59, 999);

    // Check for overlapping date-range absences
    const overlapping = await AbsentTimeSlot.find({
      doctorId,
      dispensaryId,
      isDateRange: true,
      startDate: { $lte: rangeEnd },
      endDate: { $gte: rangeStart }
    });

    if (overlapping.length > 0) {
      return res.status(409).json({
        message: 'There are overlapping absence records in this date range',
        overlappingAbsences: overlapping
      });
    }

    // Check for conflicting bookings if not forcing
    if (!force) {
      const conflictingBookings = await Booking.find({
        doctorId,
        dispensaryId,
        bookingDate: { $gte: rangeStart, $lte: rangeEnd },
        status: { $nin: ['cancelled'] }
      }).select('patientName patientPhone bookingDate estimatedTime appointmentNumber status transactionId').lean();

      if (conflictingBookings.length > 0) {
        return res.status(409).json({
          message: `There are ${conflictingBookings.length} existing booking(s) in this date range`,
          conflictingBookings,
          requiresForce: true
        });
      }
    }

    const absentSlot = new AbsentTimeSlot({
      doctorId,
      dispensaryId,
      isDateRange: true,
      startDate: rangeStart,
      endDate: rangeEnd,
      reason: reason || undefined,
      isModifiedSession: false
    });

    await absentSlot.save();
    res.status(201).json(absentSlot);
  } catch (error) {
    console.error('Error creating date range absence:', error);
    res.status(500).json({ message: 'Error creating date range absence', error: error.message });
  }
});

// Add an absent time slot (single date)
router.post('/absent', async (req, res) => {
  try {
    const absentSlot = new AbsentTimeSlot(req.body);
    await absentSlot.save();
    res.status(201).json(absentSlot);
  } catch (error) {
    console.error('Error creating absent time slot:', error);
    res.status(500).json({ message: 'Error creating absent time slot', error: error.message });
  }
});

// Delete an absent time slot
router.delete('/absent/:id', async (req, res) => {
  try {
    const absentSlot = await AbsentTimeSlot.findByIdAndDelete(req.params.id);

    if (!absentSlot) {
      return res.status(404).json({ message: 'Absent time slot not found' });
    }

    res.status(200).json({ message: 'Absent time slot deleted successfully' });
  } catch (error) {
    console.error('Error deleting absent time slot:', error);
    res.status(500).json({ message: 'Error deleting absent time slot', error: error.message });
  }
});

// New endpoint to get available time slots with appointment numbers (supports multiple sessions)
router.get('/available/:doctorId/:dispensaryId/:date', async (req, res) => {
  try {
    const { doctorId, dispensaryId, date } = req.params;
    const { timeSlotConfigId } = req.query; // Optional: filter to a specific session

    // Parse the date
    const bookingDate = new Date(date);
    const dayOfWeek = bookingDate.getDay();

    // 1. Get ALL time slot configurations for this day
    const timeSlotConfigs = await TimeSlotConfig.find({
      doctorId,
      dispensaryId,
      dayOfWeek
    }).sort({ startTime: 1 });

    if (!timeSlotConfigs || timeSlotConfigs.length === 0) {
      return res.status(200).json({
        available: false,
        reason: 'no_config',
        message: 'No regular schedule found for this day'
      });
    }

    // Get dispensary-level booking cutoff
    const dispensaryForCutoff = await Dispensary.findById(dispensaryId).lean();
    const cutoffMinutes = dispensaryForCutoff?.bookingCutoffMinutes ?? 60;
    const now = new Date();

    // 2. Check date-range absences (full day)
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    const dateRangeAbsent = await AbsentTimeSlot.findOne({
      doctorId, dispensaryId,
      isDateRange: true,
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay }
    });

    if (dateRangeAbsent) {
      return res.status(200).json({
        available: false,
        reason: 'absent',
        message: 'Doctor is not available on this date'
      });
    }

    // 3. Check for full-day single-date absence (no timeSlotConfigId = applies to all sessions)
    const fullDayAbsent = await AbsentTimeSlot.findOne({
      doctorId, dispensaryId,
      isDateRange: { $ne: true },
      isModifiedSession: false,
      timeSlotConfigId: { $exists: false },
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (fullDayAbsent) {
      return res.status(200).json({
        available: false,
        reason: 'absent',
        message: 'Doctor is not available on this date'
      });
    }

    // 4. Get per-session absent slots for this date
    const sessionAbsentSlots = await AbsentTimeSlot.find({
      doctorId, dispensaryId,
      isDateRange: { $ne: true },
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const absentByConfigId = {};
    const absentFullDay = []; // absent slots without timeSlotConfigId (legacy)
    sessionAbsentSlots.forEach(a => {
      if (a.timeSlotConfigId) {
        absentByConfigId[a.timeSlotConfigId.toString()] = a;
      } else {
        absentFullDay.push(a);
      }
    });

    // Legacy: if there's a single absent slot without timeSlotConfigId and isModifiedSession=false
    // it was created before multi-session support, treat as full-day absence
    if (absentFullDay.length > 0 && absentFullDay.some(a => !a.isModifiedSession)) {
      return res.status(200).json({
        available: false,
        reason: 'absent',
        message: 'Doctor is not available on this date'
      });
    }

    // 5. Get existing bookings for this day
    const existingBookings = await Booking.find({
      doctorId, dispensaryId,
      bookingDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' }
    }).sort({ appointmentNumber: 1 });

    // Group bookings by timeSlotConfigId
    const bookingsByConfigId = {};
    const bookingsWithoutConfigId = [];
    existingBookings.forEach(b => {
      const cid = b.timeSlotConfigId ? b.timeSlotConfigId.toString() : null;
      if (cid) {
        if (!bookingsByConfigId[cid]) bookingsByConfigId[cid] = [];
        bookingsByConfigId[cid].push(b);
      } else {
        bookingsWithoutConfigId.push(b);
      }
    });

    // 6. Build sessions array
    const sessions = [];
    let expiredSessionCount = 0;
    let fullyBookedSessionCount = 0;
    let absentSessionCount = 0;

    // Filter to specific session if requested
    const configsToProcess = timeSlotConfigId
      ? timeSlotConfigs.filter(c => c._id.toString() === timeSlotConfigId)
      : timeSlotConfigs;

    for (const config of configsToProcess) {
      const configId = config._id.toString();
      const absentSlot = absentByConfigId[configId];

      // Skip if this specific session is marked absent
      if (absentSlot && !absentSlot.isModifiedSession) {
        absentSessionCount++;
        continue;
      }

      // Determine session parameters first (need modified times for cutoff check)
      let startTime, endTime, minutesPerPatient, maxPatients;
      let isModified = false;

      if (absentSlot && absentSlot.isModifiedSession) {
        startTime = absentSlot.startTime;
        endTime = absentSlot.endTime;
        maxPatients = absentSlot.maxPatients || config.maxPatients;
        minutesPerPatient = absentSlot.minutesPerPatient || config.minutesPerPatient;
        isModified = true;
      } else {
        // Also check legacy absent slots (modified session without configId)
        const legacyModified = absentFullDay.find(a => a.isModifiedSession);
        if (legacyModified) {
          startTime = legacyModified.startTime;
          endTime = legacyModified.endTime;
          maxPatients = legacyModified.maxPatients || config.maxPatients;
          minutesPerPatient = legacyModified.minutesPerPatient || config.minutesPerPatient;
          isModified = true;
        } else {
          startTime = config.startTime;
          endTime = config.endTime;
          maxPatients = config.maxPatients;
          minutesPerPatient = config.minutesPerPatient;
        }
      }

      // Skip if today and session has passed the booking cutoff (using actual start time, which may be modified)
      const isToday = startOfDay.toDateString() === now.toDateString();
      if (isToday) {
        const [csh, csm] = startTime.split(':').map(Number);
        const sessionStartForCutoff = new Date(startOfDay);
        sessionStartForCutoff.setHours(csh, csm, 0, 0);
        const cutoffTime = new Date(sessionStartForCutoff.getTime() - cutoffMinutes * 60000);
        if (now > cutoffTime) {
          expiredSessionCount++;
          continue;
        }
      }

      // Get bookings for this session
      const sessionBookings = bookingsByConfigId[configId] || [];
      // Also include bookings without configId if only one config exists (backward compat)
      if (timeSlotConfigs.length === 1 && bookingsWithoutConfigId.length > 0) {
        sessionBookings.push(...bookingsWithoutConfigId);
      }

      // Calculate slots
      const [sH, sM] = startTime.split(':').map(Number);
      const [eH, eM] = endTime.split(':').map(Number);
      const totalMins = (eH * 60 + eM) - (sH * 60 + sM);
      const maxPossible = Math.min(maxPatients, Math.floor(totalMins / minutesPerPatient));

      const slots = [];
      for (let i = 1; i <= maxPossible; i++) {
        const isBooked = sessionBookings.some(b => b.appointmentNumber === i);
        if (!isBooked) {
          const offset = (i - 1) * minutesPerPatient;
          const apptTime = new Date(startOfDay);
          apptTime.setHours(sH, sM + offset, 0, 0);
          const hours = apptTime.getHours().toString().padStart(2, '0');
          const mins = apptTime.getMinutes().toString().padStart(2, '0');

          const endAppt = new Date(apptTime);
          endAppt.setMinutes(endAppt.getMinutes() + minutesPerPatient);
          const endH = endAppt.getHours().toString().padStart(2, '0');
          const endM = endAppt.getMinutes().toString().padStart(2, '0');

          slots.push({
            appointmentNumber: i,
            timeSlot: `${hours}:${mins}-${endH}:${endM}`,
            estimatedTime: `${hours}:${mins}`,
            minutesPerPatient
          });
        }
      }

      if (slots.length === 0) {
        fullyBookedSessionCount++;
      }

      sessions.push({
        timeSlotConfigId: configId,
        startTime,
        endTime,
        maxPatients,
        minutesPerPatient,
        isModified,
        totalSlots: maxPossible,
        bookedSlots: sessionBookings.length,
        availableSlots: slots.length,
        slots
      });
    }

    // Filter out sessions with no available slots
    const availableSessions = sessions.filter(s => s.availableSlots > 0);

    // Determine the reason when no sessions are available
    let unavailableReason = undefined;
    let unavailableMessage = undefined;
    if (availableSessions.length === 0) {
      const totalProcessed = configsToProcess.length;
      if (expiredSessionCount > 0 && expiredSessionCount >= (totalProcessed - absentSessionCount)) {
        // All non-absent sessions expired
        unavailableReason = 'session_expired';
        unavailableMessage = expiredSessionCount === 1
          ? 'The session for today has expired. Please select another date.'
          : `All ${expiredSessionCount} session(s) for today have expired. Please select another date.`;
      } else if (fullyBookedSessionCount > 0) {
        unavailableReason = 'fully_booked';
        unavailableMessage = 'All appointments are fully booked for this date. Please select another date.';
      } else {
        unavailableReason = 'fully_booked';
        unavailableMessage = 'No available appointments for this date.';
      }
    }

    // Backward compatible: if only one session, flatten to old format
    if (timeSlotConfigs.length === 1 && sessions.length === 1) {
      const session = sessions[0];
      return res.status(200).json({
        available: session.availableSlots > 0,
        reason: session.availableSlots > 0 ? undefined : unavailableReason,
        message: session.availableSlots > 0 ? undefined : unavailableMessage,
        isModified: session.isModified,
        sessionInfo: {
          startTime: session.startTime,
          endTime: session.endTime,
          minutesPerPatient: session.minutesPerPatient,
          maxPatients: session.maxPatients,
          timeSlotConfigId: session.timeSlotConfigId,
        },
        slots: session.slots,
        sessions
      });
    }

    res.status(200).json({
      available: availableSessions.length > 0,
      reason: unavailableReason,
      message: unavailableMessage,
      sessions,
      isModified: availableSessions.length > 0 ? availableSessions[0].isModified : false,
      sessionInfo: availableSessions.length > 0 ? {
        startTime: availableSessions[0].startTime,
        endTime: availableSessions[0].endTime,
        minutesPerPatient: availableSessions[0].minutesPerPatient,
        maxPatients: availableSessions[0].maxPatients,
        timeSlotConfigId: availableSessions[0].timeSlotConfigId,
      } : undefined,
      slots: availableSessions.length > 0 ? availableSessions[0].slots : []
    });
  } catch (error) {
    console.error('Error getting available time slots:', error);
    res.status(500).json({
      message: 'Error fetching available time slots',
      error: error.message
    });
  }
});

// New endpoint to get next 5 available days with time slots
router.get('/next-available/:doctorId/:dispensaryId', async (req, res) => {
  try {
    const { doctorId, dispensaryId } = req.params;
    const logger = require('../utils/logger');

    logger.info('Fetching next 5 available days', {
      requestId: req.requestId,
      doctorId,
      dispensaryId
    });

    // Get all time slot configurations for this doctor-dispensary pair
    const timeSlotConfigs = await TimeSlotConfig.find({
      doctorId: doctorId,
      dispensaryId: dispensaryId
    });

    if (!timeSlotConfigs || timeSlotConfigs.length === 0) {
      logger.warn('No time slot configurations found', {
        requestId: req.requestId,
        doctorId,
        dispensaryId
      });
      return res.status(200).json({
        available: false,
        message: 'No schedule found for this doctor at this dispensary'
      });
    }

    // Get dispensary-level booking cutoff setting
    const dispensaryDoc = await Dispensary.findById(dispensaryId).lean();
    const dispensaryCutoffMinutes = dispensaryDoc?.bookingCutoffMinutes ?? 60;

    const BookingModel = mongoose.models.Booking || mongoose.model('Booking', new mongoose.Schema({}));
    const availableDays = [];
    let daysChecked = 0;
    const maxDaysToCheck = 30; // Check up to 30 days to find 5 available days

    // Start from today
    let currentDate = new Date();
    console.log("--------- first current date ----------- " + currentDate);
    currentDate.setHours(0, 0, 0, 0);
    const now = new Date();
    while (availableDays.length < 5 && daysChecked < maxDaysToCheck) {
      const dayOfWeek = currentDate.getDay();

      // Find ALL configurations for this day of week
      const dayConfigs = timeSlotConfigs.filter(config => config.dayOfWeek === dayOfWeek);

      if (dayConfigs.length > 0) {
        // Use the first config for cutover/absence checks, aggregate across all configs
        const timeSlotConfig = dayConfigs[0];
        // Check if there's an absent/modified session for this specific date
        const absentSlot = await AbsentTimeSlot.findOne({
          doctorId: doctorId,
          dispensaryId: dispensaryId,
          isDateRange: { $ne: true },
          date: {
            $gte: new Date(currentDate),
            $lte: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000 - 1)
          }
        });

        // Check date-range absences
        const dateRangeAbsent = await AbsentTimeSlot.findOne({
          doctorId: doctorId,
          dispensaryId: dispensaryId,
          isDateRange: true,
          startDate: { $lte: currentDate },
          endDate: { $gte: currentDate }
        });

        // Skip if completely absent (date range or single date)
        if (dateRangeAbsent || (absentSlot && !absentSlot.isModifiedSession)) {
          currentDate.setDate(currentDate.getDate() + 1);
          daysChecked++;
          continue;
        }
        // Check if today and all sessions have passed cutoff
        let isToday = currentDate.toDateString() === now.toDateString();
        if (isToday) {
          const hasOpenSession = dayConfigs.some(config => {
            const [sh, sm] = config.startTime.split(':').map(Number);
            const ss = new Date(currentDate);
            ss.setHours(sh, sm, 0, 0);
            const co = new Date(ss.getTime() - dispensaryCutoffMinutes * 60000);
            return now <= co;
          });
          if (!hasOpenSession) {
            currentDate.setDate(currentDate.getDate() + 1);
            daysChecked++;
            continue;
          }
        }

        // Get existing bookings for this date
        const existingBookings = await BookingModel.find({
          doctorId, dispensaryId,
          bookingDate: {
            $gte: new Date(currentDate),
            $lte: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000 - 1)
          },
          status: { $ne: 'cancelled' }
        }).sort({ appointmentNumber: 1 });

        // Aggregate across all sessions for this day
        let totalMaxPatients = 0;
        let totalBookingsDone = 0;
        let totalRemainingSlots = 0;
        const sessionsInfo = [];

        for (const config of dayConfigs) {
          const configId = config._id.toString();

          // Check per-session absent
          const sessionAbsent = absentSlot; // legacy: applies to all sessions
          // For now, use simple aggregation
          let sStartTime = config.startTime;
          let sEndTime = config.endTime;
          let sMaxPatients = config.maxPatients;
          let sMinutesPerPatient = config.minutesPerPatient;
          let sIsModified = false;

          if (absentSlot && absentSlot.isModifiedSession) {
            // Legacy: modified session applies to first config only
            if (config === dayConfigs[0]) {
              sStartTime = absentSlot.startTime;
              sEndTime = absentSlot.endTime;
              sMaxPatients = absentSlot.maxPatients || config.maxPatients;
              sMinutesPerPatient = absentSlot.minutesPerPatient || config.minutesPerPatient;
              sIsModified = true;
            }
          }

          // Count bookings for this session
          const sessionBookings = existingBookings.filter(b =>
            b.timeSlotConfigId && b.timeSlotConfigId.toString() === configId
          );
          // Also count bookings without configId for backward compat (assign to first config)
          let extraBookings = 0;
          if (config === dayConfigs[0]) {
            extraBookings = existingBookings.filter(b => !b.timeSlotConfigId).length;
          }
          const sessionBookingCount = sessionBookings.length + extraBookings;

          totalMaxPatients += sMaxPatients;
          totalBookingsDone += sessionBookingCount;
          totalRemainingSlots += Math.max(0, sMaxPatients - sessionBookingCount);

          sessionsInfo.push({
            timeSlotConfigId: configId,
            startTime: sStartTime,
            endTime: sEndTime,
            maxPatients: sMaxPatients,
            minutesPerPatient: sMinutesPerPatient,
            isModified: sIsModified,
            bookingsDone: sessionBookingCount,
            remainingSlots: Math.max(0, sMaxPatients - sessionBookingCount)
          });
        }

        if (totalRemainingSlots > 0) {
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;
          const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];

          // Use first available session for backward compat fields
          const firstAvailable = sessionsInfo.find(s => s.remainingSlots > 0) || sessionsInfo[0];

          availableDays.push({
            date: dateString,
            dayName,
            startTime: firstAvailable.startTime,
            endTime: firstAvailable.endTime,
            bookingsDone: totalBookingsDone,
            nextAppointmentNumber: totalBookingsDone + 1,
            maxPatients: totalMaxPatients,
            minutesPerPatient: firstAvailable.minutesPerPatient,
            sessionInfo: {
              startTime: firstAvailable.startTime,
              endTime: firstAvailable.endTime,
              minutesPerPatient: firstAvailable.minutesPerPatient,
              maxPatients: firstAvailable.maxPatients
            },
            sessions: sessionsInfo,
            isModified: sessionsInfo.some(s => s.isModified),
            isFullyBooked: totalRemainingSlots === 0,
            remainingSlots: totalRemainingSlots
          });
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      daysChecked++;
    }

    logger.info('Successfully fetched next available days', {
      requestId: req.requestId,
      doctorId,
      dispensaryId,
      availableDaysCount: availableDays.length,
      daysChecked
    });

    res.status(200).json({
      available: availableDays.length > 0,
      availableDays: availableDays,
      totalAvailableDays: availableDays.length
    });

  } catch (error) {
    const logger = require('../utils/logger');
    logger.error('Error fetching next available days', {
      requestId: req.requestId,
      doctorId: req.params.doctorId,
      dispensaryId: req.params.dispensaryId,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      message: 'Error fetching next available days',
      error: error.message
    });
  }
});

// Get fees for a time slot
router.get('/fees/:timeSlotId', async (req, res) => {
  try {
    const { timeSlotId } = req.params;
    const timeSlot = await TimeSlotConfig.findById(timeSlotId);

    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    res.json({
      doctorFee: timeSlot.doctorFee || 0,
      dispensaryFee: timeSlot.dispensaryFee || 0,
      bookingCommission: timeSlot.bookingCommission || 0
    });
  } catch (error) {
    console.error('Error fetching time slot fees:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update fees for a time slot
router.put('/fees/:timeSlotId', requireRole([ROLES.SUPER_ADMIN, ROLES.hospital_admin]), async (req, res) => {
  try {
    const { timeSlotId } = req.params;
    const { doctorFee, dispensaryFee, bookingCommission } = req.body;

    const timeSlot = await TimeSlotConfig.findById(timeSlotId);
    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    // Update fees
    timeSlot.doctorFee = doctorFee;
    timeSlot.dispensaryFee = dispensaryFee;
    timeSlot.bookingCommission = bookingCommission;
    await timeSlot.save();

    res.json({
      message: 'Fees updated successfully',
      fees: {
        doctorFee: timeSlot.doctorFee,
        dispensaryFee: timeSlot.dispensaryFee,
        bookingCommission: timeSlot.bookingCommission
      }
    });
  } catch (error) {
    console.error('Error updating time slot fees:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete fees for a time slot
router.delete('/fees/:timeSlotId', requireRole([ROLES.SUPER_ADMIN, ROLES.hospital_admin]), async (req, res) => {
  try {
    const { timeSlotId } = req.params;
    const timeSlot = await TimeSlotConfig.findById(timeSlotId);

    if (!timeSlot) {
      return res.status(404).json({ message: 'Time slot not found' });
    }

    // Reset fees to default values
    timeSlot.doctorFee = 0;
    timeSlot.dispensaryFee = 0;
    timeSlot.bookingCommission = 0;
    await timeSlot.save();

    res.json({ message: 'Fees reset successfully' });
  } catch (error) {
    console.error('Error resetting time slot fees:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all sessions across all doctors for a dispensary on a given date
// Returns session info + booking stats per session
router.get('/sessions-by-dispensary/:dispensaryId/:date', async (req, res) => {
  try {
    const { dispensaryId, date } = req.params;

    // Parse date
    const [year, month, day] = date.split('-').map(Number);
    const bookingDate = new Date(year, month - 1, day);
    const dayOfWeek = bookingDate.getDay();

    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Find all doctors linked to this dispensary
    const doctorLinks = await DoctorDispensary.find({ dispensaryId }).lean();
    const doctorIds = [...new Set(doctorLinks.map(dl => dl.doctorId.toString()))];

    if (doctorIds.length === 0) {
      return res.status(200).json({ sessions: [] });
    }

    // Get doctors info
    const doctors = await Doctor.find({ _id: { $in: doctorIds } })
      .select('name specialization')
      .lean();
    const doctorMap = {};
    doctors.forEach(d => { doctorMap[d._id.toString()] = d; });

    // Get all time slot configs for these doctors at this dispensary for this day
    const timeSlots = await TimeSlotConfig.find({
      doctorId: { $in: doctorIds },
      dispensaryId,
      dayOfWeek
    }).lean();

    // Get all absent/modified slots for these doctors on this date (single-date)
    const absentSlots = await AbsentTimeSlot.find({
      doctorId: { $in: doctorIds },
      dispensaryId,
      isDateRange: { $ne: true },
      date: { $gte: startOfDay, $lte: endOfDay }
    }).lean();
    const absentMap = {};
    absentSlots.forEach(a => { absentMap[a.doctorId.toString()] = a; });

    // Get date-range absences that cover this date
    const dateRangeAbsents = await AbsentTimeSlot.find({
      doctorId: { $in: doctorIds },
      dispensaryId,
      isDateRange: true,
      startDate: { $lte: endOfDay },
      endDate: { $gte: startOfDay }
    }).lean();
    const dateRangeAbsentSet = new Set(dateRangeAbsents.map(a => a.doctorId.toString()));

    // Get all bookings for this dispensary on this date
    const allBookings = await Booking.find({
      dispensaryId,
      bookingDate: { $gte: startOfDay, $lte: endOfDay },
    }).select('doctorId timeSlotConfigId status').lean();

    // Build sessions array
    const sessions = [];

    for (const ts of timeSlots) {
      const doctorIdStr = ts.doctorId.toString();
      const doctor = doctorMap[doctorIdStr];
      if (!doctor) continue;

      const absent = absentMap[doctorIdStr];

      // Skip if completely absent (date range or single date)
      if (dateRangeAbsentSet.has(doctorIdStr)) continue;
      if (absent && !absent.isModifiedSession) continue;

      let startTime = ts.startTime;
      let endTime = ts.endTime;
      let isModified = false;

      if (absent && absent.isModifiedSession) {
        startTime = absent.startTime || ts.startTime;
        endTime = absent.endTime || ts.endTime;
        isModified = true;
      }

      // Count bookings for this specific session
      const sessionBookings = allBookings.filter(
        b => b.doctorId.toString() === doctorIdStr &&
          b.timeSlotConfigId && b.timeSlotConfigId.toString() === ts._id.toString()
      );

      const bookingStats = {
        total: sessionBookings.length,
        checkedIn: sessionBookings.filter(b => b.status === 'checked_in').length,
        scheduled: sessionBookings.filter(b => b.status === 'scheduled').length,
        cancelled: sessionBookings.filter(b => b.status === 'cancelled').length,
        completed: sessionBookings.filter(b => b.status === 'completed').length,
      };

      sessions.push({
        doctorId: doctorIdStr,
        doctorName: doctor.name,
        specialization: doctor.specialization || '',
        startTime,
        endTime,
        timeSlotConfigId: ts._id.toString(),
        isModified,
        bookingStats
      });
    }

    // Sort by doctor name then start time
    sessions.sort((a, b) => {
      if (a.doctorName !== b.doctorName) return a.doctorName.localeCompare(b.doctorName);
      return a.startTime.localeCompare(b.startTime);
    });

    res.status(200).json({ sessions });
  } catch (error) {
    console.error('Error getting sessions by dispensary:', error);
    res.status(500).json({ message: 'Error fetching sessions', error: error.message });
  }
});

module.exports = router;

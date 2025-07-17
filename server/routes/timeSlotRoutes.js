const express = require('express');
const router = express.Router();
const TimeSlotConfig = require('../models/TimeSlotConfig');
const AbsentTimeSlot = require('../models/AbsentTimeSlot');
const mongoose = require('mongoose');
const { validateJwt, requireRole,ROLES } = require('../middleware/authMiddleware');

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

// Get absent time slots
router.get('/absent/doctor/:doctorId/dispensary/:dispensaryId', async (req, res) => {
  try {
    const { doctorId, dispensaryId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const absentSlots = await AbsentTimeSlot.find({
      doctorId: doctorId,
      dispensaryId: dispensaryId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    });
    
    res.status(200).json(absentSlots);
  } catch (error) {
    console.error('Error getting absent time slots:', error);
    res.status(500).json({ message: 'Error fetching absent time slots', error: error.message });
  }
});

// Add an absent time slot
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

// New endpoint to get available time slots with appointment numbers
router.get('/available/:doctorId/:dispensaryId/:date', async (req, res) => {
  try {
    const { doctorId, dispensaryId, date } = req.params;
    
    // Parse the date
    const bookingDate = new Date(date);
    
    // Get day of week (0-6, where 0 is Sunday)
    const dayOfWeek = bookingDate.getDay();
    
    // 1. Get the regular time slot configuration for this day
    const timeSlotConfig = await TimeSlotConfig.findOne({
      doctorId: doctorId,
      dispensaryId: dispensaryId,
      dayOfWeek: dayOfWeek
    });
    
    if (!timeSlotConfig) {
      return res.status(200).json({
        available: false,
        reason: 'no_config',
        message: 'No regular schedule found for this day'
      });
    }
    
    // 2. Check if there's a modified/absent session for this specific date
    const absentSlot = await AbsentTimeSlot.findOne({
      doctorId: doctorId,
      dispensaryId: dispensaryId,
      date: {
        $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
        $lte: new Date(bookingDate.setHours(23, 59, 59, 999))
      }
    });
    
    // Variables to hold session details
    let startTime, endTime, minutesPerPatient, maxPatients;
    let isModified = false;
    
    // If completely absent, return no slots with reason
    if (absentSlot && !absentSlot.isModifiedSession) {
      return res.status(200).json({
        available: false,
        reason: 'absent',
        message: 'Doctor is not available on this date'
      });
    } 
    // If modified session, use those parameters
    else if (absentSlot && absentSlot.isModifiedSession) {
      startTime = absentSlot.startTime;
      endTime = absentSlot.endTime;
      maxPatients = absentSlot.maxPatients || timeSlotConfig.maxPatients;
      // Use original minutes per patient if not specified in the adjustment
      minutesPerPatient = absentSlot.minutesPerPatient || timeSlotConfig.minutesPerPatient;
      isModified = true;
    } 
    // Otherwise use the regular config
    else {
      startTime = timeSlotConfig.startTime;
      endTime = timeSlotConfig.endTime;
      maxPatients = timeSlotConfig.maxPatients;
      minutesPerPatient = timeSlotConfig.minutesPerPatient;
    }
    
    // 3. Get already booked appointments for this day
    const BookingModel = mongoose.models.Booking || mongoose.model('Booking', new mongoose.Schema({}));
    const existingBookings = await BookingModel.find({
      doctorId: doctorId,
      dispensaryId: dispensaryId,
      bookingDate: {
        $gte: new Date(bookingDate.setHours(0, 0, 0, 0)),
        $lte: new Date(bookingDate.setHours(23, 59, 59, 999))
      },
      status: { $ne: 'cancelled' }
    }).sort({ appointmentNumber: 1 });
    
    // 4. Calculate available time slots
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const sessionStartTime = new Date(bookingDate);
    sessionStartTime.setHours(startHour, startMinute, 0, 0);
    
    const sessionEndTime = new Date(bookingDate);
    sessionEndTime.setHours(endHour, endMinute, 0, 0);
    
    // Calculate total session duration in minutes
    const totalSessionMinutes = 
      (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    
    // Calculate max possible appointments based on time and minutes per patient
    const maxPossibleAppointments = Math.min(
      maxPatients,
      Math.floor(totalSessionMinutes / minutesPerPatient)
    );
    
    // Generate time slots
    const availableSlots = [];
    
    for (let i = 1; i <= maxPossibleAppointments; i++) {
      // Check if this appointment number is already booked
      const isBooked = existingBookings.some(booking => booking.appointmentNumber === i);
      
      if (!isBooked) {
        // Calculate the estimated time for this appointment
        const appointmentOffset = (i - 1) * minutesPerPatient; // Minutes from start time
        const appointmentTime = new Date(sessionStartTime);
        appointmentTime.setMinutes(appointmentTime.getMinutes() + appointmentOffset);
        
        const hours = appointmentTime.getHours().toString().padStart(2, '0');
        const minutes = appointmentTime.getMinutes().toString().padStart(2, '0');
        const estimatedTime = `${hours}:${minutes}`;
        
        // Calculate the time slot range (e.g., "18:00-18:20")
        const endOfAppointment = new Date(appointmentTime);
        endOfAppointment.setMinutes(endOfAppointment.getMinutes() + minutesPerPatient);
        
        const endHours = endOfAppointment.getHours().toString().padStart(2, '0');
        const endMinutes = endOfAppointment.getMinutes().toString().padStart(2, '0');
        
        const timeSlot = `${hours}:${minutes}-${endHours}:${endMinutes}`;
        
        availableSlots.push({
          appointmentNumber: i,
          timeSlot,
          estimatedTime,
          minutesPerPatient
        });
      }
    }
    
    // Return availability status, session info, and slots
    res.status(200).json({
      available: true,
      isModified,
      sessionInfo: {
        startTime,
        endTime,
        minutesPerPatient,
        maxPatients,
      },
      slots: availableSlots
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

    const BookingModel = mongoose.models.Booking || mongoose.model('Booking', new mongoose.Schema({}));
    const availableDays = [];
    let daysChecked = 0;
    const maxDaysToCheck = 30; // Check up to 30 days to find 5 available days

    // Start from today
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (availableDays.length < 5 && daysChecked < maxDaysToCheck) {
      const dayOfWeek = currentDate.getDay();
      
      // Find configuration for this day of week
      const timeSlotConfig = timeSlotConfigs.find(config => config.dayOfWeek === dayOfWeek);
      
      if (timeSlotConfig) {
        // Check if there's an absent/modified session for this specific date
        const absentSlot = await AbsentTimeSlot.findOne({
          doctorId: doctorId,
          dispensaryId: dispensaryId,
          date: {
            $gte: new Date(currentDate),
            $lte: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000 - 1)
          }
        });

        // Skip if completely absent
        if (absentSlot && !absentSlot.isModifiedSession) {
          currentDate.setDate(currentDate.getDate() + 1);
          daysChecked++;
          continue;
        }

        // Determine session parameters
        let startTime, endTime, minutesPerPatient, maxPatients;
        let isModified = false;

        if (absentSlot && absentSlot.isModifiedSession) {
          startTime = absentSlot.startTime;
          endTime = absentSlot.endTime;
          maxPatients = absentSlot.maxPatients || timeSlotConfig.maxPatients;
          minutesPerPatient = absentSlot.minutesPerPatient || timeSlotConfig.minutesPerPatient;
          isModified = true;
        } else {
          startTime = timeSlotConfig.startTime;
          endTime = timeSlotConfig.endTime;
          maxPatients = timeSlotConfig.maxPatients;
          minutesPerPatient = timeSlotConfig.minutesPerPatient;
        }

        // Get existing bookings for this date
        const existingBookings = await BookingModel.find({
          doctorId: doctorId,
          dispensaryId: dispensaryId,
          bookingDate: {
            $gte: new Date(currentDate),
            $lte: new Date(currentDate.getTime() + 24 * 60 * 60 * 1000 - 1)
          },
          status: { $ne: 'cancelled' }
        }).sort({ appointmentNumber: 1 });

        // Calculate bookings done and next appointment number
        const bookingsDone = existingBookings.length;
        const nextAppointmentNumber = bookingsDone + 1;
        
        // Check if there's still capacity for more bookings
        const hasAvailableSlots = bookingsDone < maxPatients;

        // Calculate total session duration in minutes
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        const totalSessionMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
        
        // Calculate max possible appointments based on time and minutes per patient
        // const maxPossibleAppointments = Math.min(
        //   maxPatients,
        //   Math.floor(totalSessionMinutes / minutesPerPatient)
        // );

        // Only add this day if there are available slots
        if (hasAvailableSlots && nextAppointmentNumber <= maxPatients) {
          const dateString = currentDate.toISOString().split('T')[0];
          const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
          
          availableDays.push({
            date: dateString,
            dayName: dayName,
            startTime: startTime,
            endTime: endTime,
            bookingsDone: bookingsDone,
            nextAppointmentNumber: nextAppointmentNumber,
            maxPatients: maxPatients,
            // maxPossibleAppointments: maxPossibleAppointments,
            minutesPerPatient: minutesPerPatient,
            sessionInfo: {
              startTime,
              endTime,
              minutesPerPatient,
              maxPatients
            },
            isModified,
            isFullyBooked: bookingsDone >= maxPatients,
            remainingSlots: maxPatients - bookingsDone
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

module.exports = router;

const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Booking = require('../models/Booking');
const Doctor = require('../models/Doctor');
const Dispensary = require('../models/Dispensary');
const authMiddleware = require('../middleware/authMiddleware');
const { validateJwt, requireRole } = require('../middleware/authMiddleware');
const moment = require('moment');

// Get all reports
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error('Error getting reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reports by dispensary
router.get('/dispensary/:dispensaryId', async (req, res) => {
  try {
    const reports = await Report.find({
      dispensaryId: req.params.dispensaryId
    }).sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (error) {
    console.error('Error getting dispensary reports:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate daily bookings report
router.post('/generate/daily-bookings', async (req, res) => {
  try {
    const { title, startDate, endDate, dispensaryId } = req.body;
    
    // Find bookings within the date range
    const bookingQuery = {
      bookingDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    if (dispensaryId) {
      bookingQuery.dispensaryId = dispensaryId;
    }
    
    const bookings = await Booking.find(bookingQuery);
    
    // Process booking data for the report
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    const noShowBookings = bookings.filter(b => b.status === 'no_show').length;
    
    // Group bookings by doctor
    const doctorBookings = {};
    for (const booking of bookings) {
      const doctorId = booking.doctorId.toString();
      if (!doctorBookings[doctorId]) {
        const doctor = await Doctor.findById(doctorId);
        doctorBookings[doctorId] = {
          doctorId,
          doctorName: doctor ? doctor.name : 'Unknown Doctor',
          bookings: 0
        };
      }
      doctorBookings[doctorId].bookings++;
    }
    
    const bookingsByDoctor = Object.values(doctorBookings);
    
    // Create the report data
    const reportData = {
      totalBookings,
      completedBookings,
      cancelledBookings,
      noShowBookings,
      bookingsByDoctor
    };
    
    // Create a new report
    const report = new Report({
      type: 'daily_bookings',
      title: title || 'Daily Bookings Report',
      parameters: { startDate, endDate, dispensaryId },
      generatedBy: req.user.id,
      dispensaryId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      data: reportData
    });
    
    await report.save();
    res.json(report);
    
  } catch (error) {
    console.error('Error generating daily bookings report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate monthly summary report
router.post('/generate/monthly-summary', async (req, res) => {
  try {
    const { title, startDate, endDate, dispensaryId } = req.body;
    
    // Find bookings within the date range
    const bookingQuery = {
      bookingDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    if (dispensaryId) {
      bookingQuery.dispensaryId = dispensaryId;
    }
    
    const bookings = await Booking.find(bookingQuery);
    
    // Process booking data for the report
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    const noShowBookings = bookings.filter(b => b.status === 'no_show').length;
    
    // Calculate revenue (assuming each completed booking has a fixed price of $100)
    const revenue = completedBookings * 100;
    
    // Group bookings by doctor
    const doctorBookings = {};
    for (const booking of bookings) {
      const doctorId = booking.doctorId.toString();
      if (!doctorBookings[doctorId]) {
        const doctor = await Doctor.findById(doctorId);
        doctorBookings[doctorId] = {
          doctorId,
          doctorName: doctor ? doctor.name : 'Unknown Doctor',
          bookings: 0
        };
      }
      doctorBookings[doctorId].bookings++;
    }
    
    // Sort doctors by number of bookings
    const popularDoctors = Object.values(doctorBookings)
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);
    
    // Create the report data
    const reportData = {
      totalBookings,
      completedBookings,
      cancelledBookings,
      noShowBookings,
      revenue,
      popularDoctors
    };
    
    // Create a new report
    const report = new Report({
      type: 'monthly_summary',
      title: title || 'Monthly Summary Report',
      parameters: { startDate, endDate, dispensaryId },
      generatedBy: req.user.id,
      dispensaryId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      data: reportData
    });
    
    await report.save();
    res.json(report);
    
  } catch (error) {
    console.error('Error generating monthly summary report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get session report (bookings for a specific doctor, dispensary, and date)
router.get('/session/:doctorId/:dispensaryId/:date', async (req, res) => {
  try {
    const { doctorId, dispensaryId, date } = req.params;
    
    // Create start and end date for the specified date
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    
    const bookings = await Booking.find({
      doctorId,
      dispensaryId,
      bookingDate: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ appointmentNumber: 1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error getting session report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate doctor performance report
router.post('/generate/doctor-performance', async (req, res) => {
  try {
    const { title, startDate, endDate, dispensaryId } = req.body;
    
    // Get all doctors, optionally filtered by dispensary
    let doctorQuery = {};
    if (dispensaryId) {
      doctorQuery.dispensaries = dispensaryId;
    }
    
    const doctors = await Doctor.find(doctorQuery);
    
    // For each doctor, get performance metrics
    const doctorPerformanceData = [];
    
    for (const doctor of doctors) {
      const doctorId = doctor._id;
      
      // Find bookings for this doctor within the date range
      const bookingQuery = {
        doctorId,
        bookingDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
      
      if (dispensaryId) {
        bookingQuery.dispensaryId = dispensaryId;
      }
      
      const doctorBookings = await Booking.find(bookingQuery);
      
      const totalPatients = doctorBookings.length;
      const completedAppointments = doctorBookings.filter(b => b.status === 'completed').length;
      
      // Calculate completion rate as a percentage
      const completionRate = totalPatients > 0 
        ? Math.round((completedAppointments / totalPatients) * 100) 
        : 0;
      
      // Mock average rating (would come from a real ratings system)
      const avgRating = 4 + Math.random();
      
      doctorPerformanceData.push({
        doctorId: doctorId.toString(),
        doctorName: doctor.name,
        totalPatients,
        avgRating: avgRating > 5 ? 5 : avgRating,
        completionRate
      });
    }
    
    // Create the report data
    const reportData = {
      doctors: doctorPerformanceData
    };
    
    // Create a new report
    const report = new Report({
      type: 'doctor_performance',
      title: title || 'Doctor Performance Report',
      parameters: { startDate, endDate, dispensaryId },
      generatedBy: req.user.id,
      dispensaryId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      data: reportData
    });
    
    await report.save();
    res.json(report);
    
  } catch (error) {
    console.error('Error generating doctor performance report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Generate dispensary revenue report
router.post('/generate/dispensary-revenue', async (req, res) => {
  try {
    const { title, startDate, endDate, dispensaryId } = req.body;
    
    // Find bookings within the date range for the specified dispensary
    const bookingQuery = {
      bookingDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: 'completed' // Only count completed bookings for revenue
    };
    
    if (dispensaryId) {
      bookingQuery.dispensaryId = dispensaryId;
    }
    
    const bookings = await Booking.find(bookingQuery);
    
    // Calculate total revenue (assuming each completed booking has a fixed price of $100)
    const totalRevenue = bookings.length * 100;
    
    // Mock revenue by service (would come from a real system with service details)
    const revenueByService = [
      { service: 'Consultation', revenue: Math.floor(totalRevenue * 0.6) },
      { service: 'Treatment', revenue: Math.floor(totalRevenue * 0.3) },
      { service: 'Medication', revenue: Math.floor(totalRevenue * 0.1) }
    ];
    
    // Group bookings by doctor
    const doctorRevenue = {};
    for (const booking of bookings) {
      const doctorId = booking.doctorId.toString();
      if (!doctorRevenue[doctorId]) {
        const doctor = await Doctor.findById(doctorId);
        doctorRevenue[doctorId] = {
          doctorId,
          doctorName: doctor ? doctor.name : 'Unknown Doctor',
          revenue: 0
        };
      }
      doctorRevenue[doctorId].revenue += 100; // $100 per completed booking
    }
    
    const revenueByDoctor = Object.values(doctorRevenue);
    
    // Create mock revenue by month data
    const revenueByMonth = [
      { month: 'January', revenue: Math.floor(Math.random() * 10000) + 5000 },
      { month: 'February', revenue: Math.floor(Math.random() * 10000) + 5000 }
    ];
    
    // Create the report data
    const reportData = {
      totalRevenue,
      revenueByService,
      revenueByDoctor,
      revenueByMonth
    };
    
    // Create a new report
    const report = new Report({
      type: 'dispensary_revenue',
      title: title || 'Dispensary Revenue Report',
      parameters: { startDate, endDate, dispensaryId },
      generatedBy: req.user.id,
      dispensaryId,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      data: reportData
    });
    
    await report.save();
    res.json(report);
    
  } catch (error) {
    console.error('Error generating dispensary revenue report:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get daily bookings report
router.get('/daily-bookings', validateJwt, async (req, res) => {
  try {
    let { date, dispensaryId, doctorId, timeSlot } = req.query;
    if (!date) return res.status(400).json({ message: 'date is required' });

    // Parse as UTC
    const start = new Date(date + 'T00:00:00.000Z');
    const end = new Date(date + 'T23:59:59.999Z');
    const query = { bookingDate: { $gte: start, $lte: end } };

    if (dispensaryId) query.dispensaryId = dispensaryId;
    if (doctorId) query.doctorId = doctorId;
    if (timeSlot) query.timeSlot = timeSlot;

    const bookings = await Booking.find(query)
      .populate('doctorId', 'name specialization')
      .populate('dispensaryId', 'name address')
      .sort({ bookingDate: 1 });

    const summary = {
      total: bookings.length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      noShow: bookings.filter(b => b.status === 'no_show').length,
      bookings: bookings.map(booking => ({
        id: booking._id,
        timeSlot: booking.timeSlot,
        patientName: booking.patientName,
        patientPhone: booking.patientPhone,
        status: booking.status,
        doctor: booking.doctorId,
        doctorName: booking.doctorId && booking.doctorId.name ? booking.doctorId.name : '',
        dispensary: booking.dispensaryId,
        dispensaryName: booking.dispensaryId && booking.dispensaryId.name ? booking.dispensaryId.name : '',
        checkedInTime: booking.checkedInTime,
        completedTime: booking.completedTime,
        bookingDate: booking.bookingDate,
      }))
    };

    res.status(200).json(summary);
  } catch (error) {
    console.error('Daily bookings report error:', error);
    res.status(500).json({ message: 'Failed to generate daily bookings report' });
  }
});

// Get monthly summary report
router.get('/monthly-summary', validateJwt, async (req, res) => {
  try {
    const { month, year, dispensaryId } = req.query;
    const startDate = moment(`${year}-${month}-01`).startOf('month').toDate();
    const endDate = moment(startDate).endOf('month').toDate();

    const query = {
      bookingDate: { $gte: startDate, $lte: endDate }
    };

    if (dispensaryId) {
      query.dispensaryId = dispensaryId;
    }

    const bookings = await Booking.find(query)
      .populate('doctorId', 'name specialization')
      .populate('dispensaryId', 'name address');

    // Group by date
    const dailyStats = {};
    bookings.forEach(booking => {
      const date = moment(booking.bookingDate).format('YYYY-MM-DD');
      if (!dailyStats[date]) {
        dailyStats[date] = {
          total: 0,
          completed: 0,
          cancelled: 0,
          noShow: 0
        };
      }
      dailyStats[date].total++;
      dailyStats[date][booking.status]++;
    });

    const summary = {
      totalBookings: bookings.length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      noShowBookings: bookings.filter(b => b.status === 'no_show').length,
      dailyStats: Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        ...stats
      }))
    };

    res.json(summary);
  } catch (error) {
    console.error('Monthly summary report error:', error);
    res.status(500).json({ message: 'Failed to generate monthly summary report' });
  }
});

// Get doctor performance report
router.get('/doctor-performance', validateJwt, async (req, res) => {
  try {
    const { doctorId, startDate, endDate, dispensaryId } = req.query;
    const query = {
      doctorId,
      bookingDate: {
        $gte: moment(startDate).startOf('day').toDate(),
        $lte: moment(endDate).endOf('day').toDate()
      }
    };

    if (dispensaryId) {
      query.dispensaryId = dispensaryId;
    }

    const bookings = await Booking.find(query)
      .populate('dispensaryId', 'name address')
      .sort({ bookingDate: 1 });

    // Calculate performance metrics
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
    const noShowBookings = bookings.filter(b => b.status === 'no_show').length;

    // Calculate average consultation time
    const completedBookingsWithTimes = bookings.filter(b => 
      b.status === 'completed' && b.checkedInTime && b.completedTime
    );
    
    const totalConsultationTime = completedBookingsWithTimes.reduce((total, booking) => {
      const duration = moment(booking.completedTime).diff(moment(booking.checkedInTime), 'minutes');
      return total + duration;
    }, 0);

    const averageConsultationTime = completedBookingsWithTimes.length > 0
      ? totalConsultationTime / completedBookingsWithTimes.length
      : 0;

    const performance = {
      totalBookings,
      completedBookings,
      cancelledBookings,
      noShowBookings,
      completionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
      cancellationRate: totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
      noShowRate: totalBookings > 0 ? (noShowBookings / totalBookings) * 100 : 0,
      averageConsultationTime,
      bookings: bookings.map(booking => ({
        id: booking._id,
        date: booking.bookingDate,
        timeSlot: booking.timeSlot,
        status: booking.status,
        dispensary: booking.dispensaryId,
        checkedInTime: booking.checkedInTime,
        completedTime: booking.completedTime
      }))
    };

    res.json(performance);
  } catch (error) {
    console.error('Doctor performance report error:', error);
    res.status(500).json({ message: 'Failed to generate doctor performance report' });
  }
});

router.get('/advance-bookings', validateJwt, async (req, res) => {
  try {
    let { startDate, endDate, dispensaryId, doctorId } = req.query;
    if (!startDate || !endDate) return res.status(400).json({ message: 'startDate and endDate are required' });

    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T23:59:59.999Z');
    const query = { bookingDate: { $gte: start, $lte: end } };

    if (dispensaryId) query.dispensaryId = dispensaryId;
    if (doctorId) query.doctorId = doctorId;
    console.log(query);
    const bookings = await Booking.find(query)
      .populate('doctorId', 'name specialization')
      .populate('dispensaryId', 'name address')
      .sort({ bookingDate: 1 });

    const summary = {
      total: bookings.length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      noShow: bookings.filter(b => b.status === 'no_show').length,
      bookings: bookings.map(booking => ({
        id: booking._id,
        timeSlot: booking.timeSlot,
        patientName: booking.patientName,
        patientPhone: booking.patientPhone,
        status: booking.status,
        doctor: booking.doctorId,
        doctorName: booking.doctorId && booking.doctorId.name ? booking.doctorId.name : '',
        dispensary: booking.dispensaryId,
        dispensaryName: booking.dispensaryId && booking.dispensaryId.name ? booking.dispensaryId.name : '',
        checkedInTime: booking.checkedInTime,
        completedTime: booking.completedTime,
        bookingDate: booking.bookingDate,
      }))
    };
    console.log(summary);
    res.status(200).json(summary);
  } catch (error) {
    console.error('Advance bookings report error:', error);
    res.status(500).json({ message: 'Failed to generate advance bookings report' });
  }
});

module.exports = router;

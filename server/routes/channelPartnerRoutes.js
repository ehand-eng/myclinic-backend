const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const roleMiddleware = require('../middleware/roleMiddleware');
const mongoose = require('mongoose');

// Get channel partner bookings report
router.get('/reports', roleMiddleware.requireOwnReportsAccess, async (req, res) => {
  try {
    // Reliable role detection
    let userRole = null;
    if (req.user && req.user.role) {
      userRole = req.user.role.toLowerCase();
    } else if (req.headers['x-user-role']) {
      userRole = req.headers['x-user-role'].toLowerCase();
    }
    console.log("Report role check:", { tokenRole: req.user?.role, headerRole: req.headers['x-user-role'], finalRole: userRole });
    if (!userRole) {
      return res.status(400).json({ message: "Missing X-User-Role header" });
    }

    const { startDate, endDate, channelPartnerId } = req.query;
    const isChannelPartner = userRole === 'channel-partner';
    
    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter.bookingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Build query based on role
    let query = {
      ...dateFilter,
      bookedBy: 'CHANNEL-PARTNER'
    };
    
    // If user is a channel partner, only show their own bookings
    if (isChannelPartner) {
      // Try multiple sources to get the user ID
      const userId = req.user?.id || req.user?._id || req.body.userId || req.query.userId;
      
      console.log('Channel partner user identification:', {
        userId,
        userFromReq: req.user,
        bodyUserId: req.body.userId,
        queryUserId: req.query.userId
      });
      
      if (userId) {
        query.bookedUser = userId;
      } else {
        return res.status(400).json({
          message: 'User ID required for channel partner reports',
          error: 'Cannot identify channel partner user',
          debug: {
            reqUser: req.user,
            bodyUserId: req.body.userId,
            queryUserId: req.query.userId
          }
        });
      }
    } else if (channelPartnerId) {
      // Admin/Super Admin can filter by specific channel partner
      query.bookedUser = channelPartnerId;
    }
    
    console.log('Channel partner report query:', JSON.stringify(query));
    
    // Get bookings with populated data
    const bookings = await Booking.find(query)
      .populate('doctorId', 'name specialization')
      .populate('dispensaryId', 'name address')
      .sort({ bookingDate: -1 })
      .limit(1000); // Reasonable limit for reports
    
    // Calculate summary statistics
    const summary = {
      totalBookings: bookings.length,
      totalRevenue: 0,
      totalChannelPartnerFees: 0,
      totalCommissions: 0,
      statusBreakdown: {
        scheduled: 0,
        completed: 0,
        cancelled: 0,
        'no_show': 0
      }
    };
    
    bookings.forEach(booking => {
      if (booking.fees) {
        summary.totalRevenue += booking.fees.totalFee || 0;
        summary.totalChannelPartnerFees += booking.fees.channelPartnerFee || 0;
        summary.totalCommissions += booking.fees.bookingCommission || 0;
      }
      
      if (booking.status) {
        summary.statusBreakdown[booking.status] = (summary.statusBreakdown[booking.status] || 0) + 1;
      }
    });
    
    // Format response
    const reportData = bookings.map(booking => ({
      _id: booking._id,
      transactionId: booking.transactionId,
      patientName: booking.patientName,
      patientPhone: booking.patientPhone,
      doctorName: booking.doctorId?.name || 'Unknown Doctor',
      doctorSpecialization: booking.doctorId?.specialization || 'Unknown',
      dispensaryName: booking.dispensaryId?.name || 'Unknown Dispensary',
      dispensaryAddress: booking.dispensaryId?.address || 'Unknown Address',
      bookingDate: booking.bookingDate,
      estimatedTime: booking.estimatedTime,
      status: booking.status,
      fees: {
        doctorFee: booking.fees?.doctorFee || 0,
        dispensaryFee: booking.fees?.dispensaryFee || 0,
        channelPartnerFee: booking.fees?.channelPartnerFee || 0,
        bookingCommission: booking.fees?.bookingCommission || 0,
        totalFee: booking.fees?.totalFee || 0
      },
      bookedUser: booking.bookedUser,
      createdAt: booking.createdAt
    }));
    
    res.json({
      message: 'Channel partner report generated successfully',
      userRole,
      isChannelPartner,
      dateRange: {
        startDate: startDate || null,
        endDate: endDate || null
      },
      summary,
      reportData,
      count: reportData.length
    });
    
  } catch (error) {
    console.error('Error generating channel partner report:', error);
    res.status(500).json({
      message: 'Server error generating report',
      error: error.message
    });
  }
});

// Get channel partner summary (for dashboard)
router.get('/summary', roleMiddleware.requireOwnReportsAccess, async (req, res) => {
  try {
    // Reliable role detection
    let userRole = null;
    if (req.user && req.user.role) {
      userRole = req.user.role.toLowerCase();
    } else if (req.headers['x-user-role']) {
      userRole = req.headers['x-user-role'].toLowerCase();
    }
    console.log("Report role check:", { tokenRole: req.user?.role, headerRole: req.headers['x-user-role'], finalRole: userRole });
    if (!userRole) {
      return res.status(400).json({ message: "Missing X-User-Role header" });
    }
    
    const isChannelPartner = userRole === 'channel-partner';
    const userId = req.user?.id || req.user?._id || req.body.userId;
    
    // Build query
    let query = { bookedBy: 'CHANNEL-PARTNER' };
    if (isChannelPartner) {
      if (!userId) {
        return res.status(400).json({
          message: 'User ID required for channel partner summary',
          error: 'Cannot identify channel partner user'
        });
      }
      query.bookedUser = userId;
    }
    
    // Get current month data
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const monthlyQuery = {
      ...query,
      bookingDate: {
        $gte: currentMonth,
        $lt: nextMonth
      }
    };
    
    // Get aggregated data
    const [totalBookings, monthlyBookings, revenueData] = await Promise.all([
      Booking.countDocuments(query),
      Booking.countDocuments(monthlyQuery),
      Booking.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$fees.totalFee' },
            totalChannelPartnerFees: { $sum: '$fees.channelPartnerFee' },
            totalCommissions: { $sum: '$fees.bookingCommission' }
          }
        }
      ])
    ]);
    
    const revenue = revenueData[0] || {
      totalRevenue: 0,
      totalChannelPartnerFees: 0,
      totalCommissions: 0
    };
    
    res.json({
      message: 'Channel partner summary generated successfully',
      isChannelPartner,
      summary: {
        totalBookings,
        monthlyBookings,
        ...revenue
      }
    });
    
  } catch (error) {
    console.error('Error generating channel partner summary:', error);
    res.status(500).json({
      message: 'Server error generating summary',
      error: error.message
    });
  }
});

// Get list of channel partners (for admin use)
router.get('/partners', roleMiddleware.requireRole(['super-admin', 'dispensary-admin']), async (req, res) => {
  try {
    // Get unique channel partner users from bookings
    const partners = await Booking.aggregate([
      { $match: { bookedBy: 'CHANNEL-PARTNER' } },
      {
        $group: {
          _id: '$bookedUser',
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$fees.totalFee' },
          totalChannelPartnerFees: { $sum: '$fees.channelPartnerFee' },
          lastBooking: { $max: '$createdAt' },
          firstBooking: { $min: '$createdAt' }
        }
      },
      { $sort: { totalBookings: -1 } }
    ]);
    
    res.json({
      message: 'Channel partners list generated successfully',
      partners,
      count: partners.length
    });
    
  } catch (error) {
    console.error('Error getting channel partners list:', error);
    res.status(500).json({
      message: 'Server error getting partners list',
      error: error.message
    });
  }
});

module.exports = router;
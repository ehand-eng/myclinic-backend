const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Doctor = require('../models/Doctor');
const Dispensary = require('../models/Dispensary');
const mongoose = require('mongoose');
const { validateCustomJwt } = require('../middleware/customAuthMiddleware');

function normalizeDispensaryIds(ids) {
  if (!ids || !Array.isArray(ids)) return [];
  return ids.map((d) => {
    if (typeof d === 'string') return d;
    if (!d) return null;
    if (d._id) return String(d._id);
    if (d.id) return String(d.id);
    if (typeof d.toString === 'function') return d.toString();
    return null;
  }).filter(Boolean);
}

// Roles that see only their assigned dispensaries (everyone except super-admin)
function isDispensaryScopedRole(role) {
  const r = (role || '').toLowerCase().replace(/\s+/g, '-');
  return r !== 'super-admin';
}

// GET /api/dashboard/stats - returns analytics for the dashboard (respects role; supports range filter and recent-bookings pagination)
router.get('/stats', validateCustomJwt, async (req, res) => {
  try {
    const user = req.user;
    const role = (user?.role || '').toLowerCase().replace(/\s+/g, '-');
    let dispensaryIds = [];

    console.log('[Dashboard] User:', user?.id, 'Role:', role, 'Raw dispensaryIds:', user?.dispensaryIds);

    if (role === 'super-admin') {
      const all = await Dispensary.find({}, '_id');
      dispensaryIds = all.map((d) => d._id.toString());
    } else {
      dispensaryIds = normalizeDispensaryIds(user?.dispensaryIds);
      console.log('[Dashboard] Normalized dispensaryIds:', dispensaryIds);
      if (isDispensaryScopedRole(user?.role) && dispensaryIds.length === 0) {
        console.log('[Dashboard] No dispensaryIds for scoped role, returning empty stats');
        return res.json({
          totalDispensaries: 0,
          totalDoctors: 0,
          todayBookings: 0,
          weekBookings: 0,
          monthBookings: 0,
          completedThisMonth: 0,
          scheduledToday: 0,
          bookingsByStatus: {},
          bookingsLast7Days: [],
          recentBookings: [],
          recentBookingsTotal: 0,
          recentBookingsPage: 1,
          recentBookingsLimit: 10,
          bookingsByDispensary: [],
          range: req.query.range || 'last_month',
          dateFrom: null,
          dateTo: null,
        });
      }
    }

    console.log('[Dashboard] Final dispensaryIds for query:', dispensaryIds);

    const now = new Date();
    // Use UTC consistently to match DB date parsing
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const todayEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

    // Range filter: today | last_week | last_month
    const range = (req.query.range || 'today').toLowerCase();
    let rangeStart = new Date(todayStart);
    let rangeEnd = new Date(todayEnd);
    if (range === 'last_week') {
      rangeStart.setDate(rangeStart.getDate() - 6);
    } else if (range === 'last_month') {
      rangeStart.setDate(rangeStart.getDate() - 29);
    }

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);
    const monthStart = new Date(todayStart);
    monthStart.setMonth(monthStart.getMonth() - 1);

    const baseMatch = {};
    if (dispensaryIds.length > 0) {
      baseMatch.dispensaryId = { $in: dispensaryIds.map((id) => new mongoose.Types.ObjectId(id)) };
    }

    const dateFilterForRange = () => {
      if (!rangeStart || !rangeEnd) return {};
      return { bookingDate: { $gte: rangeStart, $lte: rangeEnd } };
    };

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    // Aggregate daily stats for the chart (scheduled vs completed)
    const dailyAggMatch = {
      ...baseMatch,
      ...dateFilterForRange(),
      status: { $in: ['scheduled', 'completed'] },
    };
    const dailyAgg = await Booking.aggregate([
      { $match: dailyAggMatch },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$bookingDate" } },
            status: "$status"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    const dailyStatsMap = {};
    dailyAgg.forEach(({ _id, count }) => {
      const { date, status } = _id;
      if (!dailyStatsMap[date]) {
        dailyStatsMap[date] = { date, scheduled: 0, completed: 0 };
      }
      if (status === 'scheduled') dailyStatsMap[date].scheduled = count;
      if (status === 'completed') dailyStatsMap[date].completed = count;
    });
    
    // Sort array by date ascending
    const dailyStats = Object.values(dailyStatsMap).sort((a, b) => a.date.localeCompare(b.date));

    const recentMatch = { ...baseMatch, ...dateFilterForRange() };

    const [
      totalDispensaries,
      totalDoctors,
      todayBookings,
      periodBookings,
      statusAgg,
      recentBookingsTotal,
      recentBookingsList,
      byDispensaryAgg,
    ] = await Promise.all([
      dispensaryIds.length
        ? Dispensary.countDocuments({ _id: { $in: dispensaryIds.map((id) => new mongoose.Types.ObjectId(id)) } })
        : Dispensary.countDocuments(),
      dispensaryIds.length
        ? Doctor.countDocuments({
            dispensaries: { $in: dispensaryIds.map((id) => new mongoose.Types.ObjectId(id)) },
            disabled: { $ne: true },
          })
        : Doctor.countDocuments({ disabled: { $ne: true } }),
      Booking.countDocuments({
        ...baseMatch,
        bookingDate: { $gte: todayStart, $lte: todayEnd },
        status: { $ne: 'cancelled' },
      }),
      Booking.countDocuments({
        ...baseMatch,
        ...dateFilterForRange(),
        status: { $ne: 'cancelled' },
      }),
      Booking.aggregate([
        {
          $match: baseMatch.dispensaryId
            ? { ...baseMatch, ...dateFilterForRange() }
            : dateFilterForRange(),
        },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Booking.countDocuments(recentMatch),
      Booking.find(recentMatch)
        .sort({ bookingDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('doctorId', 'name specialization')
        .populate('dispensaryId', 'name')
        .lean(),
      dispensaryIds.length
        ? Booking.aggregate([
            {
              $match: {
                dispensaryId: { $in: dispensaryIds.map((id) => new mongoose.Types.ObjectId(id)) },
                ...dateFilterForRange(),
                status: { $ne: 'cancelled' },
              },
            },
            { $group: { _id: '$dispensaryId', count: { $sum: 1 } } },
            { $lookup: { from: 'dispensaries', localField: '_id', foreignField: '_id', as: 'dispensary' } },
            { $unwind: '$dispensary' },
            { $project: { name: '$dispensary.name', count: 1, _id: 0 } },
          ])
        : Booking.aggregate([
            {
              $match: {
                ...dateFilterForRange(),
                status: { $ne: 'cancelled' },
              },
            },
            { $group: { _id: '$dispensaryId', count: { $sum: 1 } } },
            { $lookup: { from: 'dispensaries', localField: '_id', foreignField: '_id', as: 'dispensary' } },
            { $unwind: '$dispensary' },
            { $project: { name: '$dispensary.name', count: 1, _id: 0 } },
          ]),
    ]);

    const bookingsByStatus = {};
    statusAgg.forEach(({ _id, count }) => {
      bookingsByStatus[_id || 'unknown'] = count;
    });
    const periodScheduled = statusAgg.find((g) => g._id === 'scheduled')?.count || 0;
    const periodCompleted = statusAgg.find((g) => g._id === 'completed')?.count || 0;

    console.log('[Dashboard] Response summary:', {
      totalDispensaries,
      totalDoctors,
      todayBookings,
      periodBookings,
      periodScheduled,
      periodCompleted,
      recentBookingsTotal,
      recentBookingsCount: recentBookingsList.length,
      byDispensaryCount: byDispensaryAgg.length,
    });
    if (recentBookingsList.length > 0) {
      console.log('[Dashboard] Sample recent booking dispensaryIds:', recentBookingsList.slice(0, 3).map(b => ({
        _id: b._id,
        dispensaryId: b.dispensaryId?._id || b.dispensaryId,
        dispensaryName: b.dispensaryId?.name,
        patientName: b.patientName,
        status: b.status,
        bookingDate: b.bookingDate,
      })));
    }

    res.json({
      totalDispensaries,
      totalDoctors,
      todayBookings,
      periodScheduled,
      periodCompleted,
      periodBookings,
      bookingsByStatus,
      dailyStats,
      recentBookings: recentBookingsList.map((b) => ({
        _id: b._id,
        transactionId: b.transactionId,
        patientName: b.patientName,
        patientPhone: b.patientPhone,
        bookingDate: b.bookingDate,
        status: b.status,
        doctorName: b.doctorId?.name,
        dispensaryName: b.dispensaryId?.name,
      })),
      recentBookingsTotal: recentBookingsTotal,
      recentBookingsPage: page,
      recentBookingsLimit: limit,
      bookingsByDispensary: byDispensaryAgg,
      range,
      dateFrom: rangeStart ? rangeStart.toISOString() : null,
      dateTo: rangeEnd ? rangeEnd.toISOString() : null,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Failed to load dashboard stats', error: error.message });
  }
});

module.exports = router;

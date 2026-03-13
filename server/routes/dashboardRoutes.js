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
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    // Range filter: last_week | last_month | all_time
    const range = (req.query.range || 'last_month').toLowerCase();
    let rangeStart = null;
    let rangeEnd = null;
    if (range === 'last_week') {
      rangeEnd = new Date(todayEnd);
      rangeStart = new Date(todayStart);
      rangeStart.setDate(rangeStart.getDate() - 7);
    } else if (range === 'last_month') {
      rangeEnd = new Date(todayEnd);
      rangeStart = new Date(todayStart);
      rangeStart.setDate(rangeStart.getDate() - 30);
    }
    // all_time: rangeStart/rangeEnd stay null

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

    // Last 7 calendar days (unchanged for chart)
    const last7DaysAgg = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const count = await Booking.countDocuments({
        ...baseMatch,
        bookingDate: { $gte: start, $lte: end },
        status: { $ne: 'cancelled' },
      });
      last7DaysAgg.push({ date: start.toISOString().split('T')[0], count });
    }

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
    const completedThisMonth = statusAgg.find((g) => g._id === 'completed')?.count || 0;
    const weekBookings = periodBookings;
    const monthBookings = periodBookings;

    console.log('[Dashboard] Response summary:', {
      totalDispensaries,
      totalDoctors,
      todayBookings,
      periodBookings,
      completedThisMonth,
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
      weekBookings,
      monthBookings,
      completedThisMonth,
      scheduledToday: todayBookings,
      periodBookings,
      bookingsByStatus,
      bookingsLast7Days: last7DaysAgg,
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

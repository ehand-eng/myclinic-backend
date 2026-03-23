
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Dispensary = require('../models/Dispensary');
const ReplacementDoctor = require('../models/ReplacementDoctor');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Allow super-admin or dispensary-admin to disable/enable doctors
const requireDoctorManager = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Authorization required' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const role = (decoded.role || '').toLowerCase().replace(/_/g, '-');
    const allowed = role === 'super-admin' || role === 'dispensary-admin';
    if (!allowed) {
      return res.status(403).json({ message: 'Only Super Administrators or Dispensary Administrators can disable or enable doctors' });
    }
    req.user = { id: decoded.userId, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**Get all doctors
 * GET /api/doctors
 * Query: activeOnly=true to exclude disabled (for public/booking)
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();

  try {
    const activeOnly = req.query.activeOnly === 'true';
    const query = activeOnly ? { disabled: { $ne: true } } : {};
    logger.info('Fetching all doctors', {
      requestId: req.requestId,
      activeOnly
    });
    const doctors = await Doctor.find(query).populate('dispensaries', 'name');
    res.status(200).json(doctors);
  } catch (error) {
    logger.error('Error fetching all doctors', {
      requestId: req.requestId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error fetching doctors', error: error.message });
  }
});

// Delete a replacement doctor entry (must be before /:id to avoid conflict)
router.delete('/replacement/:id', requireDoctorManager, async (req, res) => {
  try {
    const replacement = await ReplacementDoctor.findByIdAndDelete(req.params.id);
    if (!replacement) {
      return res.status(404).json({ message: 'Replacement not found' });
    }
    res.status(200).json({ message: 'Replacement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting replacement', error: error.message });
  }
});

/**Get doctor by ID
 * GET /api/doctors/:id
 */
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    logger.info('Fetching doctor by ID', {
      doctorId: id
    });

    const doctor = await Doctor.findById(id).populate('dispensaries', 'name');

    if (!doctor) {
      logger.warn('Doctor not found', {
        doctorId: id
      });
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(200).json(doctor);
  } catch (error) {
    logger.error('Error fetching doctor by ID', {
      doctorId: id,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error fetching doctor', error: error.message });
  }
});

/**Get doctors by dispensary ID
 * Query: activeOnly=true to exclude disabled (for public/booking)
 */
router.get('/dispensary/:dispensaryId', async (req, res) => {
  const { dispensaryId } = req.params;
  const activeOnly = req.query.activeOnly === 'true';

  try {
    logger.info('Fetching doctors by dispensary ID', {
      dispensaryId,
      activeOnly
    });

    const dispensary = await Dispensary.findById(dispensaryId);
    if (!dispensary) {
      logger.warn('Dispensary not found when fetching doctors', {
        dispensaryId
      });
      return res.status(404).json({ message: 'Dispensary not found' });
    }

    const query = { dispensaries: dispensaryId };
    if (activeOnly) query.disabled = { $ne: true };
    const doctors = await Doctor.find(query);
    if (!doctors) {
      logger.warn('Doctors not found for dispensary', {
        dispensaryId
      });
      return res.status(404).json({ message: 'Doctors not found' });
    }

    res.status(200).json(doctors);
  } catch (error) {
    logger.error('Error fetching doctors by dispensary ID', {
      dispensaryId,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Error fetching doctors', error: error.message });
  }
});

// POST /api/doctors/by-dispensaries
router.post('/by-dispensaries', async (req, res) => {
  const { dispensaryIds, activeOnly } = req.body;

  try {
    logger.info('Fetching doctors by multiple dispensary IDs', {
      requestId: req.requestId,
      dispensaryIds,
      dispensaryCount: dispensaryIds?.length || 0,
      userAgent: req.get('User-Agent')
    });

    if (!Array.isArray(dispensaryIds) || dispensaryIds.length === 0) {
      logger.warn('Invalid dispensary IDs provided', {
        requestId: req.requestId,
        dispensaryIds,
        error: 'No dispensary IDs provided or invalid format'
      });
      return res.status(400).json({ message: 'No dispensary IDs provided' });
    }

    const query = { dispensaries: { $in: dispensaryIds } };
    if (activeOnly) query.disabled = { $ne: true };
    const doctors = await Doctor.find(query);

    // const duration = Date.now() - startTime;
    logger.info('Successfully fetched doctors by dispensary IDs', {
      requestId: req.requestId,
      dispensaryIds,
      doctorCount: doctors.length
    });

    res.json(doctors);
  } catch (error) {
    logger.error('Error fetching doctors by dispensary IDs', {
      requestId: req.requestId,
      dispensaryIds,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**Create a new doctor
 */
router.post('/', async (req, res) => {
  const doctorData = req.body;

  try {
    logger.info('Creating new doctor', {
      doctorName: doctorData.name,
      dispensaryCount: doctorData.dispensaries?.length || 0
    });

    const doctor = new Doctor(doctorData);

    // Handle adding doctor to dispensaries
    if (doctorData.dispensaries && doctorData.dispensaries.length > 0) {

      for (const dispensaryId of doctorData.dispensaries) {
        const dispensary = await Dispensary.findById(dispensaryId);
        if (dispensary) {
          dispensary.doctors.push(doctor._id);
          await dispensary.save();
          logger.debug('Added doctor to dispensary', {
            requestId: req.requestId,
            doctorId: doctor._id,
            dispensaryId,
            dispensaryName: dispensary.name
          });
        } else {
          logger.warn('Dispensary not found when creating doctor', {
            dispensaryId
          });
        }
      }
    }

    await doctor.save();

    res.status(201).json(doctor);
  } catch (error) {
    logger.error('Error creating doctor', {
      doctorData,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Error creating doctor', error: error.message });
  }
});

/**Update doctor
 * PUT /api/doctors/:id
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const startTime = Date.now();

  try {
    logger.info('Updating doctor', {
      doctorId: id,
      updateFields: Object.keys(updateData),
    });

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      logger.warn('Doctor not found for update', {
        doctorId: id
      });
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Handle dispensary associations if they've changed
    if (updateData.dispensaries && JSON.stringify(doctor.dispensaries) !== JSON.stringify(updateData.dispensaries)) {
      logger.info('Dispensary associations changed for doctor', {
        doctorId: id,
        oldDispensaries: doctor.dispensaries,
        newDispensaries: updateData.dispensaries
      });

      // Remove doctor from old dispensaries that are not in the new list
      for (const oldDispId of doctor.dispensaries) {
        if (!updateData.dispensaries.includes(oldDispId.toString())) {
          const dispensary = await Dispensary.findById(oldDispId);
          if (dispensary) {
            dispensary.doctors = dispensary.doctors.filter(docId => docId.toString() !== doctor._id.toString());
            await dispensary.save();
            logger.debug('Removed doctor from dispensary', {
              doctorId: id,
              dispensaryId: oldDispId,
              dispensaryName: dispensary.name
            });
          }
        }
      }

      // Add doctor to new dispensaries
      for (const newDispId of updateData.dispensaries) {
        if (!doctor.dispensaries.map(id => id.toString()).includes(newDispId)) {
          const dispensary = await Dispensary.findById(newDispId);
          if (dispensary && !dispensary.doctors.map(id => id.toString()).includes(doctor._id.toString())) {
            dispensary.doctors.push(doctor._id);
            await dispensary.save();
            logger.debug('Added doctor to dispensary', {
              doctorId: id,
              dispensaryId: newDispId,
              dispensaryName: dispensary.name
            });
          }
        }
      }
    }

    // Update doctor fields
    Object.keys(updateData).forEach(key => {
      doctor[key] = updateData[key];
    });

    await doctor.save();

    res.status(200).json(doctor);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error updating doctor', {
      doctorId: id,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Error updating doctor', error: error.message });
  }
});

/** Disable a doctor (super-admin or dispensary-admin)
 * PATCH /api/doctors/:id/disable
 */
router.patch('/:id/disable', requireDoctorManager, async (req, res) => {
  const { id } = req.params;
  try {
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    doctor.disabled = true;
    await doctor.save();
    logger.info('Doctor disabled', { doctorId: id });
    res.status(200).json(doctor);
  } catch (error) {
    logger.error('Error disabling doctor', { doctorId: id, error: error.message });
    res.status(500).json({ message: 'Error disabling doctor', error: error.message });
  }
});

/** Enable a doctor (super-admin or dispensary-admin)
 * PATCH /api/doctors/:id/enable
 */
router.patch('/:id/enable', requireDoctorManager, async (req, res) => {
  const { id } = req.params;
  try {
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    doctor.disabled = false;
    await doctor.save();
    logger.info('Doctor enabled', { doctorId: id });
    res.status(200).json(doctor);
  } catch (error) {
    logger.error('Error enabling doctor', { doctorId: id, error: error.message });
    res.status(500).json({ message: 'Error enabling doctor', error: error.message });
  }
});

/**Delete doctor
 */
router.delete('/:id', async (req, res) => {
  const startTime = Date.now();
  const { id } = req.params;

  try {
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      logger.warn('Doctor not found for deletion', {
        requestId: req.requestId,
        doctorId: id
      });
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Remove doctor from dispensaries
    logger.info('Removing doctor from dispensaries', {
      doctorId: id,
      dispensaryCount: doctor.dispensaries.length
    });

    for (const dispensaryId of doctor.dispensaries) {
      const dispensary = await Dispensary.findById(dispensaryId);
      if (dispensary) {
        dispensary.doctors = dispensary.doctors.filter(docId => docId.toString() !== doctor._id.toString());
        await dispensary.save();
        logger.info('Removed doctor from dispensary', {
          requestId: req.requestId,
          doctorId: id,
          dispensaryId,
          dispensaryName: dispensary.name
        });
      }
    }

    await Doctor.findByIdAndDelete(id);

    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    logger.error('Error deleting doctor', {
      doctorId: id,
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: 'Error deleting doctor', error: error.message });
  }
});

// ============ Replacement Doctor Routes ============

// Get active replacement for a doctor at a dispensary for a given date (public - used by booking UI)
// Query param: ?date=YYYY-MM-DD (optional, defaults to today)
router.get('/:doctorId/dispensary/:dispensaryId/replacement', async (req, res) => {
  try {
    const { doctorId, dispensaryId } = req.params;
    const checkDate = req.query.date ? new Date(req.query.date) : new Date();
    checkDate.setHours(0, 0, 0, 0);

    const replacement = await ReplacementDoctor.findOne({
      doctorId, dispensaryId,
      startDate: { $lte: checkDate },
      endDate: { $gte: checkDate }
    });

    res.status(200).json(replacement || null);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching replacement', error: error.message });
  }
});

// Get all replacements for a doctor at a dispensary (admin)
router.get('/:doctorId/dispensary/:dispensaryId/replacements', async (req, res) => {
  try {
    const { doctorId, dispensaryId } = req.params;
    const replacements = await ReplacementDoctor.find({ doctorId, dispensaryId })
      .sort({ startDate: -1 });
    res.status(200).json(replacements);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching replacements', error: error.message });
  }
});

// Create a replacement doctor entry
router.post('/:doctorId/dispensary/:dispensaryId/replacement', requireDoctorManager, async (req, res) => {
  try {
    const { doctorId, dispensaryId } = req.params;
    const { replacementName, startDate, endDate, reason } = req.body;

    if (!replacementName || !startDate || !endDate) {
      return res.status(400).json({ message: 'replacementName, startDate, and endDate are required' });
    }

    const rangeStart = new Date(startDate);
    rangeStart.setHours(0, 0, 0, 0);
    const rangeEnd = new Date(endDate);
    rangeEnd.setHours(23, 59, 59, 999);

    if (rangeStart > rangeEnd) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    // Check for overlapping active replacements
    const overlap = await ReplacementDoctor.findOne({
      doctorId, dispensaryId,
      startDate: { $lte: rangeEnd },
      endDate: { $gte: rangeStart }
    });

    if (overlap) {
      return res.status(409).json({
        message: 'There is already an active replacement for this period',
        existing: overlap
      });
    }

    const replacement = new ReplacementDoctor({
      doctorId, dispensaryId,
      replacementName,
      startDate: rangeStart,
      endDate: rangeEnd,
      reason
    });

    await replacement.save();
    res.status(201).json(replacement);
  } catch (error) {
    res.status(500).json({ message: 'Error creating replacement', error: error.message });
  }
});

// Bulk get active replacements for multiple doctors at a dispensary (used by booking UI)
router.post('/replacements/active', async (req, res) => {
  try {
    const { doctorIds, dispensaryId } = req.body;
    if (!doctorIds || !dispensaryId) {
      return res.status(400).json({ message: 'doctorIds and dispensaryId are required' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const replacements = await ReplacementDoctor.find({
      doctorId: { $in: doctorIds },
      dispensaryId,
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    // Return as map: doctorId -> replacement
    const replacementMap = {};
    replacements.forEach(r => {
      replacementMap[r.doctorId.toString()] = r;
    });

    res.status(200).json(replacementMap);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching replacements', error: error.message });
  }
});

module.exports = router;

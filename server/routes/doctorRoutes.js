
const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Dispensary = require('../models/Dispensary');
const logger = require('../utils/logger');

/**Get all doctors
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();

  try {
    logger.info('Fetching all doctors', {
      requestId: req.requestId
    });
    const doctors = await Doctor.find().populate('dispensaries', 'name');
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

/**Get doctor by ID
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
 */
router.get('/dispensary/:dispensaryId', async (req, res) => {
  const { dispensaryId } = req.params;

  try {
    logger.info('Fetching doctors by dispensary ID', {
      dispensaryId
    });

    const dispensary = await Dispensary.findById(dispensaryId);
    if (!dispensary) {
      logger.warn('Dispensary not found when fetching doctors', {
        dispensaryId
      });
      return res.status(404).json({ message: 'Dispensary not found' });
    }

    const doctors = await Doctor.find({ dispensaries: dispensaryId });
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
  const { dispensaryIds } = req.body;

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

    // Find doctors who are associated with any of the given dispensary IDs
    const doctors = await Doctor.find({ dispensaries: { $in: dispensaryIds } });

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
 */
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

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

module.exports = router;

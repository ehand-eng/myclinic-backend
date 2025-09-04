const express = require('express');
const router = express.Router();
const Dispensary = require('../models/Dispensary');
const Doctor = require('../models/Doctor');

/**Get all dispensaries
 */
router.get('/', async (req, res) => {
  try {
    const dispensaries = await Dispensary.find().populate('doctors', 'name specialization');
    res.status(200).json(dispensaries);
  } catch (error) {
    console.error('Error getting dispensaries:', error);
    res.status(500).json({ message: 'Error fetching dispensaries', error: error.message });
  }
});

/**Get dispensary by ID
 */
router.get('/:id', async (req, res) => {
  try {
    console.log("======== dispensary ============== "+req.params.id);
    const dispensary = await Dispensary.findById(req.params.id).populate('doctors', 'name specialization');
    if (!dispensary) {
      return res.status(404).json({ message: 'Dispensary not found' });
    }
    res.status(200).json(dispensary);
  } catch (error) {
    console.error('Error getting dispensary:', error);
    res.status(500).json({ message: 'Error fetching dispensary', error: error.message });
  }
});

// Get dispensaries by doctor ID
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    const dispensaries = await Dispensary.find({ doctors: req.params.doctorId });
    res.status(200).json(dispensaries);
  } catch (error) {
    console.error('Error getting dispensaries by doctor:', error);
    res.status(500).json({ message: 'Error fetching dispensaries', error: error.message });
  }
});

// Get dispensaries by location (within radius)
router.get('/location/nearby', async (req, res) => {
  try {
    const { latitude, longitude, radiusKm = 10 } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }
    
    // Using MongoDB's geospatial queries would be better but for simplicity
    // we'll fetch all and filter
    const dispensaries = await Dispensary.find({ 'location.latitude': { $exists: true }, 'location.longitude': { $exists: true } });
    
    // Calculate distance using the Haversine formula
    const nearbyDispensaries = dispensaries.filter(dispensary => {
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        dispensary.location.latitude,
        dispensary.location.longitude
      );
      return distance <= parseFloat(radiusKm);
    });
    
    res.status(200).json(nearbyDispensaries);
  } catch (error) {
    console.error('Error finding nearby dispensaries:', error);
    res.status(500).json({ message: 'Error finding nearby dispensaries', error: error.message });
  }
});

// Create a new dispensary
router.post('/', async (req, res) => {
  try {
    const dispensary = new Dispensary(req.body);
    
    // Handle adding dispensary to doctors
    if (req.body.doctors && req.body.doctors.length > 0) {
      for (const doctorId of req.body.doctors) {
        const doctor = await Doctor.findById(doctorId);
        if (doctor) {
          doctor.dispensaries.push(dispensary._id);
          await doctor.save();
        }
      }
    }
    
    await dispensary.save();
    res.status(201).json(dispensary);
  } catch (error) {
    console.error('Error creating dispensary:', error);
    res.status(500).json({ message: 'Error creating dispensary', error: error.message });
  }
});

// POST /api/dispensaries/by-ids
router.post('/by-ids', async (req, res) => {
  try {
    const { ids } = req.body; // expects { ids: [id1, id2, ...] }
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No dispensary IDs provided' });
    }
    const dispensaries = await Dispensary.find({ _id: { $in: ids } });
    res.json(dispensaries);
  } catch (error) {
    console.error('Error fetching dispensaries by IDs:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update dispensary
router.put('/:id', async (req, res) => {
  try {
    const dispensary = await Dispensary.findById(req.params.id);
    if (!dispensary) {
      return res.status(404).json({ message: 'Dispensary not found' });
    }
    console.log("======== dispensary ============== "+JSON.stringify(dispensary));
    // Handle doctor associations if they've changed
    if (req.body.doctors && JSON.stringify(dispensary.doctors) !== JSON.stringify(req.body.doctors)) {
      // Remove dispensary from old doctors that are not in the new list
      console.log("-----------inside "+JSON.stringify(dispensary.doctors));
      for (const oldDocId of dispensary.doctors) {
        if (!req.body.doctors.includes(oldDocId.toString())) {
          const doctor = await Doctor.findById(oldDocId);
          if (doctor) {
            doctor.dispensaries = doctor.dispensaries.filter(dispId => dispId.toString() !== dispensary._id.toString());
            await doctor.save();
          }
        }
      }
      
      // Add dispensary to new doctors
      for (const newDocId of req.body.doctors) {
        console.log("!!!!!!!!!!!! new doctor !!!!!!!!!! "+newDocId)
        if (!dispensary.doctors.map(id => id.toString()).includes(newDocId)) {
          const doctor = await Doctor.findById(newDocId);
          if (doctor && !doctor.dispensaries.map(id => id.toString()).includes(dispensary._id.toString())) {
            doctor.dispensaries.push(dispensary._id);
            await doctor.save();
          }
        }
      }
    }
    
    // Update dispensary fields
    Object.keys(req.body).forEach(key => {
      dispensary[key] = req.body[key];
    });
    
    await dispensary.save();
    res.status(200).json(dispensary);
  } catch (error) {
    console.error('Error updating dispensary:', error);
    res.status(500).json({ message: 'Error updating dispensary', error: error.message });
  }
});

// Delete dispensary
router.delete('/:id', async (req, res) => {
  try {
    const dispensary = await Dispensary.findById(req.params.id);
    if (!dispensary) {
      return res.status(404).json({ message: 'Dispensary not found' });
    }
    
    // Remove dispensary from doctors
    for (const doctorId of dispensary.doctors) {
      const doctor = await Doctor.findById(doctorId);
      if (doctor) {
        doctor.dispensaries = doctor.dispensaries.filter(dispId => dispId.toString() !== dispensary._id.toString());
        await doctor.save();
      }
    }
    
    await Dispensary.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Dispensary deleted successfully' });
  } catch (error) {
    console.error('Error deleting dispensary:', error);
    res.status(500).json({ message: 'Error deleting dispensary', error: error.message });
  }
});

// Helper function to calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

module.exports = router;

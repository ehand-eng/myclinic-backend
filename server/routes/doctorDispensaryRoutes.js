const express = require('express');
const router = express.Router();
const DoctorDispensary = require('../models/DoctorDispensary');
const Doctor = require('../models/Doctor');
const Dispensary = require('../models/Dispensary');
const { validateJwt, requireRole, ROLES } = require('../middleware/authMiddleware');

// Get fee information for a doctor-dispensary combination
router.get('/doctor/:doctorId/dispensary/:dispensaryId', async (req, res) => {
  try {
    const { doctorId, dispensaryId } = req.params;
    
    const feeInfo = await DoctorDispensary.findOne({
      doctorId,
      dispensaryId,
      isActive: true
    }).populate('doctorId', 'name specialization')
      .populate('dispensaryId', 'name address');
    
    if (!feeInfo) {
      return res.status(404).json({ message: 'Fee information not found for this doctor-dispensary combination' });
    }
    
    res.json(feeInfo);
  } catch (error) {
    console.error('Error fetching fee information:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create or update fee information for a doctor-dispensary combination
router.post('/assign-fees', async (req, res) => {
  try {
    const { doctorId, dispensaryId, doctorFee, dispensaryFee, bookingCommission } = req.body;
    
    // Validate required fields
    if (!doctorId || !dispensaryId || doctorFee === undefined || dispensaryFee === undefined || bookingCommission === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if doctor and dispensary exist
    const doctor = await Doctor.findById(doctorId);
    const dispensary = await Dispensary.findById(dispensaryId);
    
    if (!doctor || !dispensary) {
      return res.status(404).json({ message: 'Doctor or dispensary not found' });
    }
    
    // Create or update the fee information
    const feeInfo = await DoctorDispensary.findOneAndUpdate(
      { doctorId, dispensaryId },
      {
        doctorFee: Number(doctorFee),
        dispensaryFee: Number(dispensaryFee),
        bookingCommission: Number(bookingCommission),
        isActive: true
      },
      { upsert: true, new: true }
    ).populate('doctorId', 'name specialization')
     .populate('dispensaryId', 'name address');
    
    res.json(feeInfo);
  } catch (error) {
    console.error('Error setting fee information:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all fee configurations for a doctor
router.get('/doctor/:doctorId/fees', async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    const feeConfigs = await DoctorDispensary.find({
      doctorId,
      isActive: true
    }).populate('dispensaryId', 'name address');
    
    res.json(feeConfigs);
  } catch (error) {
    console.error('Error fetching doctor fee configurations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all fee configurations for a dispensary
router.get('/dispensary/:dispensaryId/fees', async (req, res) => {
  try {
    const { dispensaryId } = req.params;
    
    const feeConfigs = await DoctorDispensary.find({
      dispensaryId,
      isActive: true
    }).populate('doctorId', 'name specialization');
    
    res.json(feeConfigs);
  } catch (error) {
    console.error('Error fetching dispensary fee configurations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all doctor-dispensary fees for a specific dispensary
// router.get('/fees/:dispensaryId', requireRole([ROLES.SUPER_ADMIN, ROLES.hospital_admin]), async (req, res) => {
  router.get('/fees/:dispensaryId', async (req, res) => {
 console.log("mmmmmmmmmm ");
  try {
    const { dispensaryId } = req.params;
    
    // Find all doctor-dispensary combinations for this dispensary
    const doctorDispensaries = await DoctorDispensary.find({ dispensaryId })
      .populate('doctorId', 'name')
      .populate('dispensaryId', 'name');

    // Map the results to include all necessary information
    const fees = doctorDispensaries.map(dd => ({
      _id: dd._id,
      doctorId: dd.doctorId._id,
      doctorName: dd.doctorId.name,
      dispensaryId: dd.dispensaryId._id,
      dispensaryName: dd.dispensaryId.name,
      doctorFee: dd.doctorFee || 0,
      dispensaryFee: dd.dispensaryFee || 0,
      bookingCommission: dd.bookingCommission || 0,
      createdAt: dd.createdAt,
      updatedAt: dd.updatedAt
    }));

    res.json(fees);
  } catch (error) {
    console.error('Error fetching doctor-dispensary fees:', error);
    res.status(500).json({ message: 'Failed to fetch doctor-dispensary fees' });
  }
});

// Update fees for a specific doctor-dispensary combination
// router.put('/fees/:doctorId/:dispensaryId', requireRole([ROLES.SUPER_ADMIN, ROLES.hospital_admin]), async (req, res) => {
  router.put('/fees/:doctorId/:dispensaryId', async (req, res) => {
  try {
    console.log("...............fees put ...........");
    const { doctorId, dispensaryId } = req.params;
    const { doctorFee, dispensaryFee, bookingCommission } = req.body;
    console.log("************* doctorId ********** "+doctorId +" dispensaryId "+dispensaryId);

    // Find and update the doctor-dispensary combination
    const doctorDispensary = await DoctorDispensary.findOneAndUpdate(
      { doctorId, dispensaryId },
      { 
        doctorFee,
        dispensaryFee,
        bookingCommission,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('doctorId', 'name')
     .populate('dispensaryId', 'name');

    if (!doctorDispensary) {
      return res.status(404).json({ message: 'Doctor-dispensary combination not found' });
    }

    res.json({
      _id: doctorDispensary._id,
      doctorId: doctorDispensary.doctorId._id,
      doctorName: doctorDispensary.doctorId.name,
      dispensaryId: doctorDispensary.dispensaryId._id,
      dispensaryName: doctorDispensary.dispensaryId.name,
      doctorFee: doctorDispensary.doctorFee || 0,
      dispensaryFee: doctorDispensary.dispensaryFee || 0,
      bookingCommission: doctorDispensary.bookingCommission || 0,
      createdAt: doctorDispensary.createdAt,
      updatedAt: doctorDispensary.updatedAt
    });
  } catch (error) {
    console.error('Error updating doctor-dispensary fees:', error);
    res.status(500).json({ message: 'Failed to update doctor-dispensary fees' });
  }
});

// Delete/reset fees for a specific doctor-dispensary combination
router.delete('/fees/:doctorId/:dispensaryId', validateJwt, requireRole([ROLES.SUPER_ADMIN, ROLES.hospital_admin]), async (req, res) => {
  try {
    const { doctorId, dispensaryId } = req.params;

    // Find and update the doctor-dispensary combination to reset fees
    const doctorDispensary = await DoctorDispensary.findOneAndUpdate(
      { doctorId, dispensaryId },
      { 
        doctorFee: 0,
        dispensaryFee: 0,
        bookingCommission: 0,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!doctorDispensary) {
      return res.status(404).json({ message: 'Doctor-dispensary combination not found' });
    }

    res.json({ message: 'Fees reset successfully' });
  } catch (error) {
    console.error('Error resetting doctor-dispensary fees:', error);
    res.status(500).json({ message: 'Failed to reset doctor-dispensary fees' });
  }
});

// Add this route after other fee routes
router.get('/fees/:doctorId/:dispensaryId', async (req, res) => {
  const { doctorId, dispensaryId } = req.params;
  try {
    const docDisp = await DoctorDispensary.findOne({ doctorId, dispensaryId });
    if (!docDisp) return res.status(404).json({ message: 'Fee config not found' });
    const { doctorFee, dispensaryFee, bookingCommission } = docDisp;
    res.json({
      doctorFee,
      dispensaryFee,
      bookingCommission,
      totalFee: (doctorFee || 0) + (dispensaryFee || 0) + (bookingCommission || 0)
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;

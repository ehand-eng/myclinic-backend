const express = require('express');
const router = express.Router();
const DoctorDispensary = require('../models/DoctorDispensary');
const Doctor = require('../models/Doctor');
const Dispensary = require('../models/Dispensary');

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
    const { doctorId, dispensaryId, doctorFee, dispensaryFee, bookingCommission, channelPartnerFee } = req.body;
    
    // Validate required fields
    if (!doctorId || !dispensaryId || doctorFee === undefined || dispensaryFee === undefined || bookingCommission === undefined) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Validate channelPartnerFee (should default to 0 if not provided and must be non-negative)
    const validatedChannelPartnerFee = channelPartnerFee !== undefined ? Number(channelPartnerFee) : 0;
    if (validatedChannelPartnerFee < 0) {
      return res.status(400).json({ message: 'Channel partner fee must be non-negative' });
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
        channelPartnerFee: validatedChannelPartnerFee,
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
      channelPartnerFee: dd.channelPartnerFee || 0,
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
    const { doctorFee, dispensaryFee, bookingCommission, channelPartnerFee } = req.body;
    console.log("************* doctorId ********** "+doctorId +" dispensaryId "+dispensaryId);

    // Validate channelPartnerFee (should default to 0 if not provided and must be non-negative)
    const validatedChannelPartnerFee = channelPartnerFee !== undefined ? Number(channelPartnerFee) : 0;
    if (validatedChannelPartnerFee < 0) {
      return res.status(400).json({ message: 'Channel partner fee must be non-negative' });
    }

    // Find and update the doctor-dispensary combination
    const doctorDispensary = await DoctorDispensary.findOneAndUpdate(
      { doctorId, dispensaryId },
      { 
        doctorFee,
        dispensaryFee,
        bookingCommission,
        channelPartnerFee: validatedChannelPartnerFee,
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
      channelPartnerFee: doctorDispensary.channelPartnerFee || 0,
      createdAt: doctorDispensary.createdAt,
      updatedAt: doctorDispensary.updatedAt
    });
  } catch (error) {
    console.error('Error updating doctor-dispensary fees:', error);
    res.status(500).json({ message: 'Failed to update doctor-dispensary fees' });
  }
});

// Delete/reset fees for a specific doctor-dispensary combination
router.delete('/fees/:doctorId/:dispensaryId', async (req, res) => {
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

// Get specific fee configuration by doctorId and dispensaryId
router.get('/fees/:doctorId/:dispensaryId', async (req, res) => {
  try {
    const { doctorId, dispensaryId } = req.params;
    
    const docDisp = await DoctorDispensary.findOne({ doctorId, dispensaryId })
      .populate('doctorId', 'name')
      .populate('dispensaryId', 'name');
      
    if (!docDisp) {
      return res.status(404).json({ message: 'Fee configuration not found' });
    }
    
    const response = {
      _id: docDisp._id,
      doctorId: docDisp.doctorId._id,
      doctorName: docDisp.doctorId.name,
      dispensaryId: docDisp.dispensaryId._id,
      dispensaryName: docDisp.dispensaryId.name,
      doctorFee: docDisp.doctorFee || 0,
      dispensaryFee: docDisp.dispensaryFee || 0,
      bookingCommission: docDisp.bookingCommission || 0,
      channelPartnerFee: docDisp.channelPartnerFee || 0,
      totalFee: (docDisp.doctorFee || 0) + (docDisp.dispensaryFee || 0) + (docDisp.bookingCommission || 0),
      createdAt: docDisp.createdAt,
      updatedAt: docDisp.updatedAt
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching fee configuration:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update specific fee by ID (PATCH route)
router.patch('/fees/:feeId', async (req, res) => {
  try {
    const { feeId } = req.params;
    const { doctorFee, dispensaryFee, bookingCommission, channelPartnerFee } = req.body;
    
    // Validate input
    if (doctorFee !== undefined && (isNaN(doctorFee) || doctorFee < 0)) {
      return res.status(400).json({ message: 'Invalid doctor fee' });
    }
    if (dispensaryFee !== undefined && (isNaN(dispensaryFee) || dispensaryFee < 0)) {
      return res.status(400).json({ message: 'Invalid dispensary fee' });
    }
    if (bookingCommission !== undefined && (isNaN(bookingCommission) || bookingCommission < 0)) {
      return res.status(400).json({ message: 'Invalid booking commission' });
    }
    if (channelPartnerFee !== undefined && (isNaN(channelPartnerFee) || channelPartnerFee < 0)) {
      return res.status(400).json({ message: 'Invalid channel partner fee' });
    }
    
    const updateData = {};
    if (doctorFee !== undefined) updateData.doctorFee = Number(doctorFee);
    if (dispensaryFee !== undefined) updateData.dispensaryFee = Number(dispensaryFee);
    if (bookingCommission !== undefined) updateData.bookingCommission = Number(bookingCommission);
    if (channelPartnerFee !== undefined) updateData.channelPartnerFee = Number(channelPartnerFee);
    updateData.updatedAt = new Date();
    
    const updatedFee = await DoctorDispensary.findByIdAndUpdate(
      feeId,
      updateData,
      { new: true }
    ).populate('doctorId', 'name')
     .populate('dispensaryId', 'name');
    
    if (!updatedFee) {
      return res.status(404).json({ message: 'Fee configuration not found' });
    }
    
    const response = {
      _id: updatedFee._id,
      doctorId: updatedFee.doctorId._id,
      doctorName: updatedFee.doctorId.name,
      dispensaryId: updatedFee.dispensaryId._id,
      dispensaryName: updatedFee.dispensaryId.name,
      doctorFee: updatedFee.doctorFee || 0,
      dispensaryFee: updatedFee.dispensaryFee || 0,
      bookingCommission: updatedFee.bookingCommission || 0,
      channelPartnerFee: updatedFee.channelPartnerFee || 0,
      createdAt: updatedFee.createdAt,
      updatedAt: updatedFee.updatedAt
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error updating fee configuration:', error);
    res.status(500).json({ message: 'Failed to update fee configuration', error: error.message });
  }
});

// Delete fee configuration by ID
router.delete('/fees/:feeId', async (req, res) => {
  try {
    const { feeId } = req.params;
    
    const deletedFee = await DoctorDispensary.findByIdAndDelete(feeId);
    
    if (!deletedFee) {
      return res.status(404).json({ message: 'Fee configuration not found' });
    }
    
    res.json({ message: 'Fee configuration deleted successfully', deletedId: feeId });
  } catch (error) {
    console.error('Error deleting fee configuration:', error);
    res.status(500).json({ message: 'Failed to delete fee configuration', error: error.message });
  }
});

module.exports = router;

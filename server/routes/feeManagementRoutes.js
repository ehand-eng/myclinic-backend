const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Dispensary = require('../models/Dispensary');
const DoctorDispensary = require('../models/DoctorDispensary');

// GET /api/doctors - Return list of all doctors
router.get('/doctors', async (req, res) => {
  try {
    console.log('Fetching all doctors...');
    
    const doctors = await Doctor.find({})
      .select('_id name specialization email contactNumber')
      .lean();
    
    const formattedDoctors = doctors.map(doctor => ({
      id: doctor._id.toString(),
      name: doctor.name,
      specialization: doctor.specialization,
      email: doctor.email,
      contactNumber: doctor.contactNumber
    }));
    
    console.log(`Found ${formattedDoctors.length} doctors`);
    res.json(formattedDoctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ 
      message: 'Failed to fetch doctors', 
      error: error.message 
    });
  }
});

// GET /api/dispensaries/:doctorId - Return dispensaries bound to a specific doctor
router.get('/dispensaries/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log(`Fetching dispensaries for doctor ID: ${doctorId}`);
    
    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      console.log(`Doctor not found: ${doctorId}`);
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Find dispensaries that have this doctor
    // Method 1: Look in dispensary.doctors array
    const dispensariesWithDoctor = await Dispensary.find({
      doctors: doctorId
    }).select('_id name address contactNumber email').lean();
    
    // Method 2: Also check DoctorDispensary table for additional relationships
    const doctorDispensaryRelations = await DoctorDispensary.find({
      doctorId: doctorId,
      isActive: true
    }).populate('dispensaryId', '_id name address contactNumber email').lean();
    
    // Combine both methods to get all dispensaries
    const dispensaryMap = new Map();
    
    // Add from dispensary.doctors array
    dispensariesWithDoctor.forEach(dispensary => {
      dispensaryMap.set(dispensary._id.toString(), {
        id: dispensary._id.toString(),
        name: dispensary.name,
        address: dispensary.address,
        contactNumber: dispensary.contactNumber,
        email: dispensary.email
      });
    });
    
    // Add from DoctorDispensary relations
    doctorDispensaryRelations.forEach(relation => {
      if (relation.dispensaryId) {
        dispensaryMap.set(relation.dispensaryId._id.toString(), {
          id: relation.dispensaryId._id.toString(),
          name: relation.dispensaryId.name,
          address: relation.dispensaryId.address,
          contactNumber: relation.dispensaryId.contactNumber,
          email: relation.dispensaryId.email
        });
      }
    });
    
    const dispensaries = Array.from(dispensaryMap.values());
    
    console.log(`Found ${dispensaries.length} dispensaries for doctor ${doctor.name}`);
    console.log('Dispensaries:', dispensaries.map(d => `${d.name} (${d.id})`));
    
    res.json(dispensaries);
  } catch (error) {
    console.error('Error fetching dispensaries for doctor:', error);
    res.status(500).json({ 
      message: 'Failed to fetch dispensaries', 
      error: error.message 
    });
  }
});

// GET /api/doctor-dispensaries/fees/:doctorId - Return existing fees for a doctor
router.get('/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;
    console.log(`Fetching fees for doctor ID: ${doctorId}`);
    
    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      console.log(`Doctor not found: ${doctorId}`);
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Find all fee configurations for this doctor
    const feeConfigurations = await DoctorDispensary.find({
      doctorId: doctorId,
      isActive: true
    })
    .populate('doctorId', 'name specialization')
    .populate('dispensaryId', 'name address')
    .lean();
    
    const fees = feeConfigurations.map(config => ({
      id: config._id.toString(),
      doctorId: config.doctorId._id.toString(),
      dispensaryId: config.dispensaryId._id.toString(),
      bookingCode: config.bookingCode || '',
      doctorFee: config.doctorFee || 0,
      dispensaryFee: config.dispensaryFee || 0,
      channelPartnerFee: config.channelPartnerFee || 0,
      onlineFee: config.bookingCommission || 0,
      doctorName: config.doctorId.name,
      doctorSpecialization: config.doctorId.specialization,
      dispensaryName: config.dispensaryId.name,
      dispensaryAddress: config.dispensaryId.address,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    }));
    
    console.log(`Found ${fees.length} fee configurations for doctor ${doctor.name}`);
    res.json(fees);
  } catch (error) {
    console.error('Error fetching doctor fees:', error);
    res.status(500).json({ 
      message: 'Failed to fetch doctor fees', 
      error: error.message 
    });
  }
});

// POST /api/fees/:doctorId - Add new fee
router.post('/:doctorId', async (req, res) => {
  try {
    console.log("======== doctor-dispensaries/fees ============== "+req.params.doctorId);
    const { doctorId } = req.params;
    const { dispensaryId, doctorFee, dispensaryFee, onlineFee, channelPartnerFee, bookingCode } = req.body;
    
    console.log(`Creating fee for doctor ${doctorId}, dispensary ${dispensaryId}`);
    console.log('Fee data:', { doctorFee, dispensaryFee, onlineFee, channelPartnerFee: channelPartnerFee || 0, bookingCode });
    
    // Validate inputs
    if (!dispensaryId) {
      return res.status(400).json({ message: 'Dispensary ID is required' });
    }
    
    if (doctorFee === undefined || dispensaryFee === undefined || onlineFee === undefined) {
      return res.status(400).json({ message: 'All fee fields are required' });
    }
    
    if (doctorFee < 0 || dispensaryFee < 0 || onlineFee < 0 || (channelPartnerFee && channelPartnerFee < 0)) {
      return res.status(400).json({ message: 'Fee amounts cannot be negative' });
    }
    
    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found !!!' });
    }
    
    // Validate dispensary exists
    const dispensary = await Dispensary.findById(dispensaryId);
    if (!dispensary) {
      return res.status(404).json({ message: 'Dispensary not found' });
    }
    
    // Check if fee configuration already exists
    const existingFee = await DoctorDispensary.findOne({
      doctorId,
      dispensaryId,
      isActive: true
    });
    
    if (existingFee) {
      return res.status(409).json({ 
        message: 'Fee configuration already exists for this doctor-dispensary combination' 
      });
    }

    // Handle bookingCode generation if missing
    let finalBookingCode = bookingCode;
    if (!finalBookingCode) {
      const existingCodesDocs = await DoctorDispensary.find({ bookingCode: { $exists: true } }).select('bookingCode').lean();
      const usedCodes = new Set(existingCodesDocs.map(d => d.bookingCode));
      let seqIndex = 0;
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

      do {
        const letterIndex = Math.floor(seqIndex / 999);
        if (letterIndex >= letters.length) throw new Error('Maximum shortcodes reached.');
        const letter = letters[letterIndex];
        const number = (seqIndex % 999) + 1;
        finalBookingCode = `${letter}${String(number).padStart(3, '0')}`;
        seqIndex++;
      } while (usedCodes.has(finalBookingCode));
    } else {
      finalBookingCode = finalBookingCode.toUpperCase();
    }
    
    // Create new fee configuration
    const newFeeConfig = new DoctorDispensary({
      doctorId,
      dispensaryId,
      bookingCode: finalBookingCode,
      doctorFee: Number(doctorFee),
      dispensaryFee: Number(dispensaryFee),
      channelPartnerFee: Number(channelPartnerFee || 0),
      bookingCommission: Number(onlineFee),
      isActive: true
    });
    
    await newFeeConfig.save();
    
    // Populate and return the created fee
    const populatedFee = await DoctorDispensary.findById(newFeeConfig._id)
      .populate('doctorId', 'name specialization')
      .populate('dispensaryId', 'name address')
      .lean();
    
    const responseData = {
      id: populatedFee?._id?.toString() || newFeeConfig._id.toString(),
      doctorId: populatedFee?.doctorId?._id?.toString() || doctorId,
      dispensaryId: populatedFee?.dispensaryId?._id?.toString() || dispensaryId,
      bookingCode: populatedFee?.bookingCode || finalBookingCode,
      doctorFee: populatedFee?.doctorFee || Number(doctorFee),
      dispensaryFee: populatedFee?.dispensaryFee || Number(dispensaryFee),
      channelPartnerFee: populatedFee?.channelPartnerFee || Number(channelPartnerFee || 0),
      onlineFee: populatedFee?.bookingCommission || Number(onlineFee),
      doctorName: populatedFee?.doctorId?.name || doctor.name,
      doctorSpecialization: populatedFee?.doctorId?.specialization || doctor.specialization,
      dispensaryName: populatedFee?.dispensaryId?.name || dispensary.name,
      dispensaryAddress: populatedFee?.dispensaryId?.address || dispensary.address,
      createdAt: populatedFee?.createdAt || new Date(),
      updatedAt: populatedFee?.updatedAt || new Date()
    };
    
    console.log('Created fee configuration:', responseData.id);
    res.status(201).json(responseData);
  } catch (error) {
    console.error('Error creating fee:', error);
    if (error.code === 11000) {
      const field = error.keyPattern && error.keyPattern.bookingCode ? 'Booking code' : 'Combination';
      return res.status(409).json({ 
        message: `${field} already exists and must be unique.`, 
        error: error.message 
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error. Please check your inputs.', 
        error: error.message 
      });
    }
    res.status(500).json({ 
      message: 'Failed to create fee', 
      error: error.message 
    });
  }
});

// PUT /api/doctor-dispensaries/fees/:doctorId/:feeId - Update existing fee
router.put('/:doctorId/:feeId', async (req, res) => {
  try {
    console.log("==== put ==== fees ============== "+req.params.doctorId);
    const { doctorId, feeId } = req.params;
    const { doctorFee, dispensaryFee, onlineFee, channelPartnerFee, bookingCode } = req.body;
    
    console.log(`Updating fee ${feeId} for doctor ${doctorId}`);
    console.log('New fee data:', { doctorFee, dispensaryFee, onlineFee, channelPartnerFee: channelPartnerFee || 0, bookingCode });
    
    // Validate inputs
    if (doctorFee === undefined || dispensaryFee === undefined || onlineFee === undefined) {
      return res.status(400).json({ message: 'All fee fields are required' });
    }
    
    if (doctorFee < 0 || dispensaryFee < 0 || onlineFee < 0) {
      return res.status(400).json({ message: 'Fee amounts cannot be negative' });
    }
    
    // Find and update the fee configuration
    const updatedFee = await DoctorDispensary.findOneAndUpdate(
      { 
        _id: feeId, 
        doctorId: doctorId,
        isActive: true
      },
      {
        bookingCode: bookingCode ? bookingCode.toUpperCase() : undefined,
        doctorFee: Number(doctorFee),
        dispensaryFee: Number(dispensaryFee),
        channelPartnerFee: Number(channelPartnerFee || 0),
        bookingCommission: Number(onlineFee),
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true
      }
    )
    .populate('doctorId', 'name specialization')
    .populate('dispensaryId', 'name address')
    .lean();
    
    if (!updatedFee) {
      return res.status(404).json({ message: 'Fee configuration not found' });
    }
    
    const responseData = {
      id: updatedFee?._id?.toString() || feeId,
      doctorId: updatedFee?.doctorId?._id?.toString() || doctorId,
      dispensaryId: updatedFee?.dispensaryId?._id?.toString() || '',
      bookingCode: updatedFee?.bookingCode || '',
      doctorFee: updatedFee?.doctorFee || 0,
      dispensaryFee: updatedFee?.dispensaryFee || 0,
      channelPartnerFee: updatedFee?.channelPartnerFee || 0,
      onlineFee: updatedFee?.bookingCommission || 0,
      doctorName: updatedFee?.doctorId?.name || '',
      doctorSpecialization: updatedFee?.doctorId?.specialization || '',
      dispensaryName: updatedFee?.dispensaryId?.name || '',
      dispensaryAddress: updatedFee?.dispensaryId?.address || '',
      createdAt: updatedFee?.createdAt,
      updatedAt: updatedFee?.updatedAt
    };
    
    console.log('Updated fee configuration:', responseData.id);
    res.json(responseData);
  } catch (error) {
    console.error('Error updating fee:', error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: 'This booking code is already in use.', 
        error: error.message 
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error. Please check your inputs.', 
        error: error.message 
      });
    }
    res.status(500).json({ 
      message: 'Failed to update fee', 
      error: error.message 
    });
  }
});

// DELETE /api/doctor-dispensaries/fees/:doctorId/:feeId - Delete fee
router.delete('/:doctorId/:feeId', async (req, res) => {
  try {
    const { doctorId, feeId } = req.params;
    
    console.log(`Deleting fee ${feeId} for doctor ${doctorId}`);
    
    // Find and delete the fee configuration
    const deletedFee = await DoctorDispensary.findOneAndDelete({
      _id: feeId,
      doctorId: doctorId,
      isActive: true
    }).lean();
    
    if (!deletedFee) {
      return res.status(404).json({ message: 'Fee configuration not found' });
    }
    
    console.log('Deleted fee configuration:', deletedFee._id.toString());
    res.json({ 
      message: 'Fee configuration deleted successfully',
      deletedFee: {
        id: deletedFee._id.toString(),
        doctorId: deletedFee.doctorId.toString(),
        dispensaryId: deletedFee.dispensaryId.toString()
      }
    });
  } catch (error) {
    console.error('Error deleting fee:', error);
    res.status(500).json({ 
      message: 'Failed to delete fee', 
      error: error.message 
    });
  }
});

// GET /api/doctor-dispensaries/fees/:doctorId/:feeId - Get specific fee (for debugging)
router.get('/doctor-dispensaries/fees/:doctorId/:feeId', async (req, res) => {
  try {
    const { doctorId, feeId } = req.params;
    
    console.log(`Fetching specific fee ${feeId} for doctor ${doctorId}`);
    
    const fee = await DoctorDispensary.findOne({
      _id: feeId,
      doctorId: doctorId,
      isActive: true
    })
    .populate('doctorId', 'name specialization')
    .populate('dispensaryId', 'name address')
    .lean();
    
    if (!fee) {
      return res.status(404).json({ message: 'Fee configuration not found' });
    }
    
    const responseData = {
      id: fee._id.toString(),
      doctorId: fee.doctorId._id.toString(),
      dispensaryId: fee.dispensaryId._id.toString(),
      bookingCode: fee.bookingCode || '',
      doctorFee: fee.doctorFee,
      dispensaryFee: fee.dispensaryFee,
      onlineFee: fee.bookingCommission,
      doctorName: fee.doctorId.name,
      doctorSpecialization: fee.doctorId.specialization,
      dispensaryName: fee.dispensaryId.name,
      dispensaryAddress: fee.dispensaryId.address,
      createdAt: fee.createdAt,
      updatedAt: fee.updatedAt
    };
    
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching specific fee:', error);
    res.status(500).json({ 
      message: 'Failed to fetch fee', 
      error: error.message 
    });
  }
});

module.exports = router;
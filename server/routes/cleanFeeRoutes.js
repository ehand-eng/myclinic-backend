const express = require('express');
const router = express.Router();

// In-memory data for demo purposes
let doctors = [
  { id: '1', name: 'Dr. John Smith', specialization: 'Cardiology' },
  { id: '2', name: 'Dr. Sarah Wilson', specialization: 'Dermatology' },
  { id: '3', name: 'Dr. Michael Brown', specialization: 'Neurology' },
  { id: '4', name: 'Dr. Emily Davis', specialization: 'Pediatrics' }
];

let dispensaries = [
  { id: '1', name: 'Central Pharmacy', address: '123 Main St', doctorIds: ['1', '2', '3'] },
  { id: '2', name: 'City Medical Center', address: '456 Oak Ave', doctorIds: ['1', '4'] },
  { id: '3', name: 'Downtown Clinic', address: '789 Pine Rd', doctorIds: ['2', '3', '4'] },
  { id: '4', name: 'Westside Hospital', address: '321 Elm St', doctorIds: ['1', '3'] }
];

let fees = [
  {
    id: '1',
    doctorId: '1',
    dispensaryId: '1',
    doctorFee: 1500,
    dispensaryFee: 500,
    onlineFee: 200,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: '2',
    doctorId: '1',
    dispensaryId: '2',
    doctorFee: 1800,
    dispensaryFee: 600,
    onlineFee: 250,
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: '3',
    doctorId: '2',
    dispensaryId: '3',
    doctorFee: 1200,
    dispensaryFee: 400,
    onlineFee: 150,
    createdAt: new Date('2024-01-17'),
    updatedAt: new Date('2024-01-17')
  }
];

// Helper functions
const findDoctorById = (id) => doctors.find(doc => doc.id === id);
const findDispensaryById = (id) => dispensaries.find(disp => disp.id === id);
const generateId = () => Date.now().toString();

// GET /api/doctors - Return list of all doctors
router.get('/doctors', (req, res) => {
  try {
    res.json(doctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: 'Failed to fetch doctors', error: error.message });
  }
});

// GET /api/dispensaries/:doctorId - Return dispensaries for a specific doctor
router.get('/dispensaries/:doctorId', (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Validate doctor exists
    const doctor = findDoctorById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Find dispensaries that serve this doctor
    const doctorDispensaries = dispensaries.filter(dispensary => 
      dispensary.doctorIds.includes(doctorId)
    );
    
    res.json(doctorDispensaries);
  } catch (error) {
    console.error('Error fetching dispensaries for doctor:', error);
    res.status(500).json({ message: 'Failed to fetch dispensaries', error: error.message });
  }
});

// GET /api/doctor-dispensaries/fees/:doctorId - Return fees for a specific doctor
router.get('/doctor-dispensaries/fees/:doctorId', (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Validate doctor exists
    const doctor = findDoctorById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Find all fees for this doctor
    const doctorFees = fees.filter(fee => fee.doctorId === doctorId);
    
    // Enrich with doctor and dispensary information
    const enrichedFees = doctorFees.map(fee => {
      const dispensary = findDispensaryById(fee.dispensaryId);
      return {
        ...fee,
        doctorName: doctor.name,
        doctorSpecialization: doctor.specialization,
        dispensaryName: dispensary ? dispensary.name : 'Unknown Dispensary',
        dispensaryAddress: dispensary ? dispensary.address : 'Unknown Address'
      };
    });
    
    res.json(enrichedFees);
  } catch (error) {
    console.error('Error fetching doctor fees:', error);
    res.status(500).json({ message: 'Failed to fetch doctor fees', error: error.message });
  }
});

// POST /api/doctor-dispensaries/fees/:doctorId - Create a new fee
router.post('/doctor-dispensaries/fees/:doctorId', (req, res) => {
  try {
    const { doctorId } = req.params;
    const { dispensaryId, doctorFee, dispensaryFee, onlineFee } = req.body;
    
    // Validate inputs
    if (!dispensaryId) {
      return res.status(400).json({ message: 'Dispensary ID is required' });
    }
    
    if (doctorFee === undefined || dispensaryFee === undefined || onlineFee === undefined) {
      return res.status(400).json({ message: 'All fee fields are required' });
    }
    
    if (doctorFee < 0 || dispensaryFee < 0 || onlineFee < 0) {
      return res.status(400).json({ message: 'Fee amounts cannot be negative' });
    }
    
    // Validate doctor exists
    const doctor = findDoctorById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    
    // Validate dispensary exists
    const dispensary = findDispensaryById(dispensaryId);
    if (!dispensary) {
      return res.status(404).json({ message: 'Dispensary not found' });
    }
    
    // Check if fee configuration already exists for this doctor-dispensary combination
    const existingFee = fees.find(fee => 
      fee.doctorId === doctorId && fee.dispensaryId === dispensaryId
    );
    
    if (existingFee) {
      return res.status(409).json({ 
        message: 'Fee configuration already exists for this doctor-dispensary combination' 
      });
    }
    
    // Create new fee
    const newFee = {
      id: generateId(),
      doctorId,
      dispensaryId,
      doctorFee: Number(doctorFee),
      dispensaryFee: Number(dispensaryFee),
      onlineFee: Number(onlineFee),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    fees.push(newFee);
    
    // Return enriched fee data
    const enrichedFee = {
      ...newFee,
      doctorName: doctor.name,
      doctorSpecialization: doctor.specialization,
      dispensaryName: dispensary.name,
      dispensaryAddress: dispensary.address
    };
    
    res.status(201).json(enrichedFee);
  } catch (error) {
    console.error('Error creating fee:', error);
    res.status(500).json({ message: 'Failed to create fee', error: error.message });
  }
});

// PUT /api/doctor-dispensaries/fees/:doctorId/:feeId - Update an existing fee
router.put('/doctor-dispensaries/fees/:doctorId/:feeId', (req, res) => {
  try {
    const { doctorId, feeId } = req.params;
    const { doctorFee, dispensaryFee, onlineFee } = req.body;
    
    // Validate inputs
    if (doctorFee === undefined || dispensaryFee === undefined || onlineFee === undefined) {
      return res.status(400).json({ message: 'All fee fields are required' });
    }
    
    if (doctorFee < 0 || dispensaryFee < 0 || onlineFee < 0) {
      return res.status(400).json({ message: 'Fee amounts cannot be negative' });
    }
    
    // Find the fee
    const feeIndex = fees.findIndex(fee => fee.id === feeId && fee.doctorId === doctorId);
    
    if (feeIndex === -1) {
      return res.status(404).json({ message: 'Fee configuration not found' });
    }
    
    // Update the fee
    fees[feeIndex] = {
      ...fees[feeIndex],
      doctorFee: Number(doctorFee),
      dispensaryFee: Number(dispensaryFee),
      onlineFee: Number(onlineFee),
      updatedAt: new Date()
    };
    
    const updatedFee = fees[feeIndex];
    
    // Enrich with additional data
    const doctor = findDoctorById(updatedFee.doctorId);
    const dispensary = findDispensaryById(updatedFee.dispensaryId);
    
    const enrichedFee = {
      ...updatedFee,
      doctorName: doctor ? doctor.name : 'Unknown Doctor',
      doctorSpecialization: doctor ? doctor.specialization : '',
      dispensaryName: dispensary ? dispensary.name : 'Unknown Dispensary',
      dispensaryAddress: dispensary ? dispensary.address : 'Unknown Address'
    };
    
    res.json(enrichedFee);
  } catch (error) {
    console.error('Error updating fee:', error);
    res.status(500).json({ message: 'Failed to update fee', error: error.message });
  }
});

// DELETE /api/doctor-dispensaries/fees/:doctorId/:feeId - Delete a fee
router.delete('/doctor-dispensaries/fees/:doctorId/:feeId', (req, res) => {
  try {
    const { doctorId, feeId } = req.params;
    
    // Find the fee
    const feeIndex = fees.findIndex(fee => fee.id === feeId && fee.doctorId === doctorId);
    
    if (feeIndex === -1) {
      return res.status(404).json({ message: 'Fee configuration not found' });
    }
    
    // Remove the fee
    const deletedFee = fees.splice(feeIndex, 1)[0];
    
    res.json({ 
      message: 'Fee configuration deleted successfully',
      deletedFee: {
        id: deletedFee.id,
        doctorId: deletedFee.doctorId,
        dispensaryId: deletedFee.dispensaryId
      }
    });
  } catch (error) {
    console.error('Error deleting fee:', error);
    res.status(500).json({ message: 'Failed to delete fee', error: error.message });
  }
});

// GET /api/doctor-dispensaries/fees/:doctorId/:feeId - Get a specific fee (useful for debugging)
router.get('/doctor-dispensaries/fees/:doctorId/:feeId', (req, res) => {
  try {
    const { doctorId, feeId } = req.params;
    
    const fee = fees.find(fee => fee.id === feeId && fee.doctorId === doctorId);
    
    if (!fee) {
      return res.status(404).json({ message: 'Fee configuration not found' });
    }
    
    // Enrich with additional data
    const doctor = findDoctorById(fee.doctorId);
    const dispensary = findDispensaryById(fee.dispensaryId);
    
    const enrichedFee = {
      ...fee,
      doctorName: doctor ? doctor.name : 'Unknown Doctor',
      doctorSpecialization: doctor ? doctor.specialization : '',
      dispensaryName: dispensary ? dispensary.name : 'Unknown Dispensary',
      dispensaryAddress: dispensary ? dispensary.address : 'Unknown Address'
    };
    
    res.json(enrichedFee);
  } catch (error) {
    console.error('Error fetching fee:', error);
    res.status(500).json({ message: 'Failed to fetch fee', error: error.message });
  }
});

module.exports = router;
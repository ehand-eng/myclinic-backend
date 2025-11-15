
require('dotenv').config();
const mongoose = require('mongoose');
const crypto = require('crypto');

// Import models
const User = require('./models/User');
const Doctor = require('./models/Doctor');
const Dispensary = require('./models/Dispensary');
const TimeSlotConfig = require('./models/TimeSlotConfig');
const AbsentTimeSlot = require('./models/AbsentTimeSlot');

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://myclinicuser:1qaz2wsx@E@myclinic-cluster.ht5hi.mongodb.net/?retryWrites=true&w=majority&appName=myclinic-cluster';

// Helper function to hash passwords
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Dispensary.deleteMany({});
    await TimeSlotConfig.deleteMany({});
    await AbsentTimeSlot.deleteMany({});
    
    // Create super admin user
    console.log('Creating super admin user...');
    const adminUser = new User({
      name: 'Super Admin',
      email: 'admin@example.com',
      passwordHash: hashPassword('123456'),
      role: 'super_admin',
      isActive: true,
      lastLogin: new Date()
    });
    
    await adminUser.save();
    console.log('Admin user created');
    
    // Create dispensaries
    console.log('Creating dispensaries...');
    const cityHealthClinic = new Dispensary({
      name: 'City Health Clinic',
      address: '123 Main Street, Downtown, City',
      contactNumber: '555-789-1234',
      email: 'info@cityhealthclinic.com',
      description: 'A modern health clinic providing comprehensive healthcare services.',
      doctors: [],
      location: {
        latitude: 40.7128,
        longitude: -74.0060
      }
    });
    
    const westsideMedical = new Dispensary({
      name: 'Westside Medical Center',
      address: '456 Elm Avenue, Westside, City',
      contactNumber: '555-456-7890',
      email: 'contact@westsidemedical.com',
      description: 'Specialized medical center with state-of-the-art facilities.',
      doctors: [],
      location: {
        latitude: 40.7282,
        longitude: -74.0776
      }
    });
    
    const eastsidePractice = new Dispensary({
      name: 'Eastside Family Practice',
      address: '789 Oak Road, Eastside, City',
      contactNumber: '555-321-6547',
      email: 'info@eastsidepractice.com',
      description: 'Family-focused healthcare in a comfortable environment.',
      doctors: [],
      location: {
        latitude: 40.7295,
        longitude: -73.9965
      }
    });
    
    const northsideWellness = new Dispensary({
      name: 'Northside Wellness Center',
      address: '321 Pine Boulevard, Northside, City',
      contactNumber: '555-987-6543',
      email: 'hello@northsidewellness.com',
      description: 'Integrative approach to health and wellness.',
      doctors: [],
      location: {
        latitude: 40.7831,
        longitude: -73.9712
      }
    });
    
    const savedDispensaries = await Promise.all([
      cityHealthClinic.save(),
      westsideMedical.save(),
      eastsidePractice.save(),
      northsideWellness.save()
    ]);
    
    console.log('Dispensaries created');
    
    // Create doctors
    console.log('Creating doctors...');
    const drSarah = new Doctor({
      name: 'Dr. Sarah Wilson',
      specialization: 'General Practitioner',
      qualifications: ['MBBS', 'MD'],
      contactNumber: '555-123-4567',
      email: 'sarah.wilson@example.com',
      profilePicture: 'https://randomuser.me/api/portraits/women/68.jpg',
      dispensaries: [savedDispensaries[0]._id, savedDispensaries[1]._id]
    });
    
    const drMichael = new Doctor({
      name: 'Dr. Michael Chen',
      specialization: 'Cardiologist',
      qualifications: ['MBBS', 'MD', 'DM Cardiology'],
      contactNumber: '555-987-6543',
      email: 'michael.chen@example.com',
      profilePicture: 'https://randomuser.me/api/portraits/men/45.jpg',
      dispensaries: [savedDispensaries[0]._id]
    });
    
    const drEmily = new Doctor({
      name: 'Dr. Emily Johnson',
      specialization: 'Pediatrician',
      qualifications: ['MBBS', 'MD Pediatrics'],
      contactNumber: '555-234-5678',
      email: 'emily.johnson@example.com',
      profilePicture: 'https://randomuser.me/api/portraits/women/22.jpg',
      dispensaries: [savedDispensaries[1]._id]
    });
    
    const savedDoctors = await Promise.all([
      drSarah.save(),
      drMichael.save(),
      drEmily.save()
    ]);
    
    console.log('Doctors created');
    
    // Update dispensaries with doctor IDs
    console.log('Updating dispensary-doctor relationships...');
    
    // Update City Health Clinic with doctors
    savedDispensaries[0].doctors = [savedDoctors[0]._id, savedDoctors[1]._id];
    await savedDispensaries[0].save();
    
    // Update Westside Medical with doctors
    savedDispensaries[1].doctors = [savedDoctors[0]._id, savedDoctors[2]._id];
    await savedDispensaries[1].save();
    
    console.log('Dispensary-doctor relationships updated');
    
    // Create time slot configs
    console.log('Creating time slot configurations...');
    
    const timeSlotConfigs = [
      // Dr. Sarah at City Health Clinic (Monday-Friday evenings)
      {
        doctorId: savedDoctors[0]._id,
        dispensaryId: savedDispensaries[0]._id,
        dayOfWeek: 1, // Monday
        startTime: '18:00',
        endTime: '22:00',
        maxPatients: 15
      },
      {
        doctorId: savedDoctors[0]._id,
        dispensaryId: savedDispensaries[0]._id,
        dayOfWeek: 2, // Tuesday
        startTime: '18:00',
        endTime: '22:00',
        maxPatients: 15
      },
      {
        doctorId: savedDoctors[0]._id,
        dispensaryId: savedDispensaries[0]._id,
        dayOfWeek: 3, // Wednesday
        startTime: '18:00',
        endTime: '22:00',
        maxPatients: 15
      },
      {
        doctorId: savedDoctors[0]._id,
        dispensaryId: savedDispensaries[0]._id,
        dayOfWeek: 4, // Thursday
        startTime: '18:00',
        endTime: '22:00',
        maxPatients: 15
      },
      {
        doctorId: savedDoctors[0]._id,
        dispensaryId: savedDispensaries[0]._id,
        dayOfWeek: 5, // Friday
        startTime: '18:00',
        endTime: '22:00',
        maxPatients: 15
      },
      
      // Dr. Sarah at Westside Medical (Weekend)
      {
        doctorId: savedDoctors[0]._id,
        dispensaryId: savedDispensaries[1]._id,
        dayOfWeek: 6, // Saturday
        startTime: '12:00',
        endTime: '16:00',
        maxPatients: 20
      },
      {
        doctorId: savedDoctors[0]._id,
        dispensaryId: savedDispensaries[1]._id,
        dayOfWeek: 0, // Sunday
        startTime: '10:00',
        endTime: '14:00',
        maxPatients: 12
      }
    ];
    
    await TimeSlotConfig.insertMany(timeSlotConfigs);
    console.log('Time slot configurations created');
    
    // Create some absent time slots
    console.log('Creating absent time slots...');
    
    const nextMonday = new Date();
    nextMonday.setDate(nextMonday.getDate() + (1 + 7 - nextMonday.getDay()) % 7);
    
    const nextSunday = new Date();
    nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()) % 7);
    if (nextSunday < new Date()) nextSunday.setDate(nextSunday.getDate() + 7);
    
    const absentTimeSlots = [
      {
        doctorId: savedDoctors[0]._id,
        dispensaryId: savedDispensaries[0]._id,
        date: nextMonday,
        startTime: '18:00',
        endTime: '22:00',
        reason: 'Personal emergency'
      },
      {
        doctorId: savedDoctors[0]._id,
        dispensaryId: savedDispensaries[1]._id,
        date: nextSunday,
        startTime: '10:00',
        endTime: '14:00',
        reason: 'Conference attendance'
      }
    ];
    
    await AbsentTimeSlot.insertMany(absentTimeSlots);
    console.log('Absent time slots created');
    
    console.log('Database seeded successfully!');
    console.log('\nYou can log in with:');
    console.log('Email: admin@example.com');
    console.log('Password: 123456');
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

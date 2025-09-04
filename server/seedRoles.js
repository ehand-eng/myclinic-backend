const mongoose = require('mongoose');
const Role = require('./models/Role');
require('dotenv').config();

const roles = [
  {
    name: 'super-admin',
    displayName: 'Super Administrator',
    description: 'Full system access with all permissions',
    permissions: [
      'manage:users',
      'manage:roles',
      'manage:dispensaries',
      'manage:doctors',
      'manage:fees',
      'view:reports',
      'manage:timeslots',
      'create:bookings',
      'view:bookings',
      'update:bookings'
    ]
  },
  {
    name: 'dispensary-admin',
    displayName: 'Dispensary Administrator',
    description: 'Administrator for a specific dispensary',
    permissions: [
      'manage:doctors',
      'manage:timeslots',
      'create:bookings',
      'view:bookings',
      'update:bookings',
      'view:reports'
    ]
  },
  {
    name: 'dispensary-staff',
    displayName: 'Dispensary Staff',
    description: 'Staff member of a dispensary',
    permissions: [
      'create:bookings',
      'view:bookings',
      'update:bookings'
    ]
  },
  {
    name: 'doctor',
    displayName: 'Doctor',
    description: 'Medical practitioner',
    permissions: [
      'view:bookings',
      'update:bookings'
    ]
  }
];

async function seedRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing roles
    await Role.deleteMany({});
    console.log('Cleared existing roles');

    // Insert new roles
    for (const roleData of roles) {
      const role = new Role(roleData);
      await role.save();
      console.log(`Created role: ${role.displayName}`);
    }

    console.log('Role seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding roles:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seeder
if (require.main === module) {
  seedRoles();
}

module.exports = seedRoles;
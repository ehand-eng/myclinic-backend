const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Role = require('./models/Role');
require('dotenv').config();

async function createSuperAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find super-admin role
    const superAdminRole = await Role.findOne({ name: 'super-admin' });
    if (!superAdminRole) {
      console.error('Super admin role not found. Please run seedRoles.js first.');
      return;
    }

    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ 
      email: 'admin@myclinic.com' 
    });

    if (existingSuperAdmin) {
      console.log('Super admin already exists with email: admin@myclinic.com');
      return;
    }

    // Hash password
    const password = 'admin123'; // Change this to a secure password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create super admin user
    const superAdmin = new User({
      name: 'Super Administrator',
      email: 'admin@myclinic.com',
      passwordHash,
      role: superAdminRole._id,
      dispensaryIds: [],
      isActive: true,
      lastLogin: new Date()
    });

    await superAdmin.save();
    console.log('Super admin user created successfully!');
    console.log('Email: admin@myclinic.com');
    console.log('Password: admin123');
    console.log('⚠️  Please change the password after first login!');

  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  createSuperAdmin();
}

module.exports = createSuperAdmin;
const mongoose = require('mongoose');
const Role = require('./models/Role');
require('dotenv').config();

async function seedChannelPartnerRole() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/doctor-reservation');
    console.log('Connected to MongoDB');

    // Check if channel-partner role already exists
    const existingRole = await Role.findOne({ name: 'channel-partner' });
    
    if (existingRole) {
      console.log('Channel Partner role already exists');
      console.log('Existing role:', JSON.stringify(existingRole, null, 2));
      return;
    }

    // Create the channel-partner role
    const channelPartnerRole = new Role({
      _id: new mongoose.Types.ObjectId('68ab69ced849d9e806e32f02'),
      name: 'channel-partner',
      displayName: 'Channel Partner',
      description: 'External partner with booking creation permissions',
      permissions: [
        'create:bookings',
        'view:own-reports'
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await channelPartnerRole.save();
    console.log('✅ Channel Partner role created successfully');
    console.log('Role details:', JSON.stringify(channelPartnerRole, null, 2));

    // List all roles to verify
    const allRoles = await Role.find({});
    console.log('\n📋 All roles in system:');
    allRoles.forEach(role => {
      console.log(`- ${role.displayName} (${role.name}) - Active: ${role.isActive}`);
    });

  } catch (error) {
    console.error('❌ Error seeding channel partner role:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding function
if (require.main === module) {
  seedChannelPartnerRole().then(() => {
    console.log('Seeding completed');
    process.exit(0);
  }).catch(error => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}

module.exports = seedChannelPartnerRole;
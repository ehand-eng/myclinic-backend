require('dotenv').config();
const mongoose = require('mongoose');
const DoctorDispensary = require('../models/DoctorDispensary');

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/myclinic';
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Convert an integer index (0-based) into a code like A001, A002... Z999
function generateCodeFromSequence(seqIndex) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  // 1 through 999 are valid per letter
  const letterIndex = Math.floor(seqIndex / 999);
  if (letterIndex >= letters.length) {
    throw new Error('Exceeded maximum shortcode capacity (Z999).');
  }
  
  const letter = letters[letterIndex];
  const number = (seqIndex % 999) + 1; // 1-based output (001 to 999)
  
  return `${letter}${String(number).padStart(3, '0')}`;
}

async function runMigration() {
  try {
    const relationshipsWithoutCode = await DoctorDispensary.find({ 
      $or: [
        { bookingCode: { $exists: false } },
        { bookingCode: null },
        { bookingCode: "" }
      ]
    }).populate('doctorId').populate('dispensaryId');

    console.log(`Found ${relationshipsWithoutCode.length} Doctor-Dispensary relationships needing a shortcode.`);
    
    if (relationshipsWithoutCode.length === 0) {
      console.log('No migration needed. Exiting.');
      process.exit(0);
    }

    // Get all currently used codes to avoid collisions
    const allRels = await DoctorDispensary.find({ bookingCode: { $exists: true, $ne: null } }).select('bookingCode').lean();
    const usedCodes = new Set(allRels.map(d => d.bookingCode));
    
    let seqIndex = 0;
    let updatedCount = 0;

    for (const rel of relationshipsWithoutCode) {
      if (!rel.doctorId || !rel.dispensaryId) {
        console.warn(`Skipping invalid relationship ${rel._id} missing doctor or dispensary.`);
        continue;
      }

      // Find the next available code
      let candidateCode;
      do {
        candidateCode = generateCodeFromSequence(seqIndex);
        seqIndex++;
      } while (usedCodes.has(candidateCode));

      // Assign and save
      rel.bookingCode = candidateCode;
      await rel.save();
      usedCodes.add(candidateCode); // Mark as used for subsequent iterations
      
      console.log(`Assigned code ${candidateCode} to Dr. ${rel.doctorId.name} at ${rel.dispensaryId.name}`);
      updatedCount++;
    }

    console.log(`Successfully migrated ${updatedCount} relationships.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

runMigration();

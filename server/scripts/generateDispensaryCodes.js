require('dotenv').config();
const mongoose = require('mongoose');
const Dispensary = require('../models/Dispensary');

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
    const dispensariesWithoutCode = await Dispensary.find({ 
      $or: [
        { dispensaryCode: { $exists: false } },
        { dispensaryCode: null },
        { dispensaryCode: "" }
      ]
    });

    console.log(`Found ${dispensariesWithoutCode.length} dispensaries needing a shortcode.`);
    
    if (dispensariesWithoutCode.length === 0) {
      console.log('No migration needed. Exiting.');
      process.exit(0);
    }

    // Get all currently used codes to avoid collisions
    const allDispensaries = await Dispensary.find({ dispensaryCode: { $exists: true, $ne: null } }).select('dispensaryCode').lean();
    const usedCodes = new Set(allDispensaries.map(d => d.dispensaryCode));
    
    let seqIndex = 0;
    let updatedCount = 0;

    for (const dispensary of dispensariesWithoutCode) {
      // Find the next available code
      let candidateCode;
      do {
        candidateCode = generateCodeFromSequence(seqIndex);
        seqIndex++;
      } while (usedCodes.has(candidateCode));

      // Assign and save
      dispensary.dispensaryCode = candidateCode;
      await dispensary.save();
      usedCodes.add(candidateCode); // Mark as used for subsequent iterations
      
      console.log(`Assigned code ${candidateCode} to dispensary "${dispensary.name}" (${dispensary._id})`);
      updatedCount++;
    }

    console.log(`Successfully migrated ${updatedCount} dispensaries.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

runMigration();

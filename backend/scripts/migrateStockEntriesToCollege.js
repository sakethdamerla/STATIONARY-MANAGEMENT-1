const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { StockEntry } = require('../models/stockEntryModel');
const { College } = require('../models/collegeModel');

const TARGET_COLLEGE_NAME = 'Pydah College of Engineering';

async function connect() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be defined');
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
}

async function migrateStockEntries() {
  try {
    await connect();

    // 1. Find the target college
    const college = await College.findOne({ name: TARGET_COLLEGE_NAME });
    if (!college) {
      throw new Error(`Target college "${TARGET_COLLEGE_NAME}" not found. Please run seedColleges.js first.`);
    }
    console.log(`Found college: ${college.name} (${college._id})`);

    // 2. Find StockEntries that need migration (college is null or exists: false)
    const filter = {
      $or: [
        { college: { $exists: false } },
        { college: null }
      ]
    };

    const count = await StockEntry.countDocuments(filter);
    console.log(`Found ${count} stock entries to migrate.`);

    if (count > 0) {
      // 3. Update them
      const result = await StockEntry.updateMany(filter, { 
        $set: { college: college._id } 
      });

      console.log(`Successfully migrated ${result.modifiedCount} stock entries to ${college.name}.`);
    } else {
      console.log('No stock entries needed migration.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

migrateStockEntries();

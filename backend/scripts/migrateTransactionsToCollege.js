require('dotenv').config();
const mongoose = require('mongoose');
const { Transaction } = require('../models/transactionModel');
const { College } = require('../models/collegeModel');

async function connect() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set.');
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('Connected to MongoDB');
}

async function migrateTransactions() {
  try {
    await connect();

    // 1. Find Target College
    const targetCollegeName = 'Pydah College of Engineering';
    const targetCollege = await College.findOne({ name: targetCollegeName });

    if (!targetCollege) {
      throw new Error(`Target college "${targetCollegeName}" not found. Please run seedColleges.js first.`);
    }

    console.log(`Target College found: ${targetCollege.name} (${targetCollege._id})`);

    // 2. Find Transactions to Migrate
    // We want to migrate transactions that DON'T have a collegeId yet.
    // Or we force migrate all of them if the user implies "legacy data belongs here".
    // I'll filter for those where collegeId is null or missing.
    const query = { 
        $or: [
            { collegeId: { $exists: false } }, 
            { collegeId: null }
        ]
    };
    
    // Also include transactions that might be linked to legacy branches if we want to clean that up, 
    // but for now, let's focus on linking orphaned ones.
    
    const transactionsToUpdate = await Transaction.find(query);
    console.log(`Found ${transactionsToUpdate.length} transactions to migrate.`);

    if (transactionsToUpdate.length === 0) {
      console.log('No transactions need migration.');
      return;
    }

    // 3. Update Transactions
    const result = await Transaction.updateMany(
        query, 
        { $set: { collegeId: targetCollege._id } }
    );

    console.log(`Migration Complete. matched: ${result.matchedCount}, modified: ${result.modifiedCount}`);

  } catch (error) {
    console.error('Migration Failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

migrateTransactions();

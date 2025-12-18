require('dotenv').config();
const mongoose = require('mongoose');
const { Transaction } = require('../models/transactionModel');

async function connect() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
}

async function verify() {
  try {
    await connect();
    
    // Check count of transactions with collegeId
    const total = await Transaction.countDocuments({});
    const withCollege = await Transaction.countDocuments({ collegeId: { $exists: true, $ne: null } });
    const withoutCollege = await Transaction.countDocuments({ $or: [{ collegeId: { $exists: false } }, { collegeId: null }] });
    
    console.log(`Total Transactions: ${total}`);
    console.log(`With collegeId: ${withCollege}`);
    console.log(`Without collegeId: ${withoutCollege}`);
    
    // Sample one with collegeId
    if (withCollege > 0) {
        const sample = await Transaction.findOne({ collegeId: { $exists: true, $ne: null } });
        console.log('Sample Transaction with College:', {
            id: sample._id,
            transactionId: sample.transactionId,
            collegeId: sample.collegeId,
            collegeIdType: typeof sample.collegeId
        });
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

verify();

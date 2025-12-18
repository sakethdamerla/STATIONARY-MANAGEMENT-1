require('dotenv').config();
const mongoose = require('mongoose');
const { StockEntry } = require('../models/stockEntryModel');
const { College } = require('../models/collegeModel');

async function verifyStockEntries() {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI must be defined');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Fetch up to 5 stock entries
    const entries = await StockEntry.find({}).limit(5).populate('college', 'name');

    console.log(`Found ${entries.length} entries. Samples:`);
    entries.forEach(e => {
       console.log(`ID: ${e._id}, Invoice: ${e.invoiceNumber}, College Field: ${e.college}, Raw College ID: ${e.get('college')}`); 
    });
    
    // Check if any have college as null
    const nullCollegeCount = await StockEntry.countDocuments({ college: null });
    console.log(`Entries with college=null: ${nullCollegeCount}`);

    // Check target college ID
    const pyCol = await College.findOne({ name: 'Pydah College of Engineering' });
    if(pyCol) console.log(`Pydah College ID: ${pyCol._id}`);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

verifyStockEntries();

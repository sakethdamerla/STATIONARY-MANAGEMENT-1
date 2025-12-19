const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const { Transaction } = require('../models/transactionModel');

/**
 * Migration Script: Mark Old Paid Transactions as Stock Deducted
 * 
 * Problem: Before the stockDeducted field was added, all paid transactions
 * automatically deducted stock. Now these old transactions show "Stock Pending"
 * because stockDeducted is undefined/false.
 * 
 * Solution: Set stockDeducted = true for all paid transactions where
 * stockDeducted is currently undefined or false.
 */

async function connect() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be defined');
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
}

async function migrateTransactions() {
  try {
    await connect();

    console.log('Starting transaction migration...\n');

    // Find all paid transactions where stockDeducted is not true
    const filter = {
      isPaid: true,
      $or: [
        { stockDeducted: { $exists: false } },
        { stockDeducted: false }
      ]
    };

    const count = await Transaction.countDocuments(filter);
    console.log(`Found ${count} paid transactions with missing/false stockDeducted field.`);

    if (count === 0) {
      console.log('No transactions need migration. All done!');
      return;
    }

    // Show sample of transactions that will be updated
    const samples = await Transaction.find(filter)
      .select('transactionId isPaid stockDeducted transactionDate')
      .limit(5);
    
    console.log('\nSample transactions to be updated:');
    samples.forEach(tx => {
      console.log(`  - ${tx.transactionId} | Paid: ${tx.isPaid} | StockDeducted: ${tx.stockDeducted} | Date: ${new Date(tx.transactionDate).toLocaleDateString()}`);
    });

    console.log('\nUpdating transactions...');

    // Update all matching transactions
    const result = await Transaction.updateMany(
      filter,
      { $set: { stockDeducted: true } }
    );

    console.log(`\n✅ Successfully updated ${result.modifiedCount} transactions.`);
    console.log(`   - Set stockDeducted = true for all paid transactions`);
    console.log(`   - These transactions will no longer show "Stock Pending" warning`);

    // Verify the update
    const remainingCount = await Transaction.countDocuments(filter);
    if (remainingCount === 0) {
      console.log('\n✅ Verification passed: No more transactions with missing stockDeducted field.');
    } else {
      console.log(`\n⚠️  Warning: ${remainingCount} transactions still have missing stockDeducted field.`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

// Run the migration
migrateTransactions()
  .then(() => {
    console.log('\n🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Migration failed with error:', error);
    process.exit(1);
  });

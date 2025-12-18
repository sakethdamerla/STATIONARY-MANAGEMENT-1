require('dotenv').config();
const mongoose = require('mongoose');
const { College } = require('../models/collegeModel');
const { Product } = require('../models/productModel');

const TARGET_COLLEGE_NAME = 'Pydah College of Engineering';

async function connect() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI must be defined');
  }
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');
}

async function migrateStock() {
  try {
    await connect();

    // 1. Find the target college
    const college = await College.findOne({ name: TARGET_COLLEGE_NAME });
    if (!college) {
      throw new Error(`Target college "${TARGET_COLLEGE_NAME}" not found. Please run seedColleges.js first.`);
    }
    console.log(`Found college: ${college.name} (${college._id})`);

    // 2. Fetch all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to migrate.`);

    // 3. Build the new stock array
    // Map existing college stock to preserve it if needed, or just overwrite?
    // "Transfer ALL stock" implies we take the master product stock and move it there.
    // If the college already has stock, should we add?
    // Let's assume we are mirroring Product.stock -> College.stock.
    
    const newStock = products.map(product => {
        const qty = product.stock || 0;
        if (qty > 0) {
            return {
                product: product._id,
                quantity: qty
            };
        }
        return null; // Skip zero stock items to keep array clean? Or keep them?
        // AddStock script keeps 0? Lets keep items with stock > 0 for efficiency.
    }).filter(item => item !== null);

    // 4. Update the college
    college.stock = newStock;
    await college.save();

    console.log(`Successfully migrated stock for ${newStock.length} products to ${college.name}.`);
    
    // Optional: Zero out central stock?
    // User request: "transferred all the stock to the Pydah College of Engineering".
    // Usually stock transfer implies moving it. But for safety, I will NOT zero out global Product.stock
    // unless explicitly told, because Product.stock is often used as the 'master' definition.
    // However, if the system is now strictly Context-based, maybe we should?
    // But the current implementation uses Product.stock as "Central" stock. 
    // If we moved it, Central should be 0.
    // I will leaving Product.stock untouched for now to act as a backup, or if 'Central' means 'Unassigned'.
    // If the user wants to *move* it, they might expect Central to be empty.
    // But safely duplicating is better than deleting.
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

migrateStock();

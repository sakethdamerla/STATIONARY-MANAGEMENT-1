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
    
    // 5. Zero out central stock (Product.stock) since we're MOVING not COPYING
    // This prevents stock from showing in both central warehouse and college
    console.log('Zeroing out central warehouse stock...');
    const productIdsToZero = products.map(p => p._id);
    const zeroResult = await Product.updateMany(
      { _id: { $in: productIdsToZero } },
      { $set: { stock: 0 } }
    );
    console.log(`Zeroed out stock for ${zeroResult.modifiedCount} products in central warehouse.`);
    console.log('Stock has been MOVED (not copied) to the college.');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

migrateStock();

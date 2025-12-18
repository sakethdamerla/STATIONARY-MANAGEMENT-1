const mongoose = require('mongoose');

const stockEntrySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please provide a product'],
      ref: 'Product',
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please provide a vendor'],
      ref: 'Vendor',
    },
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null, // Null implies Central Stock
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide quantity'],
      min: [1, 'Quantity must be at least 1'],
    },
    invoiceNumber: {
      type: String,
      trim: true,
      default: '',
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    purchasePrice: {
      type: Number,
      min: [0, 'Purchase price cannot be negative'],
      default: 0,
    },
    totalCost: {
      type: Number,
      min: [0, 'Total cost cannot be negative'],
      default: 0,
    },
    remarks: {
      type: String,
      trim: true,
      default: '',
    },
    createdBy: {
      type: String,
      trim: true,
      default: 'System',
    },
  },
  {
    timestamps: true,
  }
);

// Calculate totalCost before saving
stockEntrySchema.pre('save', function(next) {
  if (this.purchasePrice && this.quantity) {
    this.totalCost = this.purchasePrice * this.quantity;
  }
  next();
});

// Index for faster queries
stockEntrySchema.index({ product: 1, createdAt: -1 });
stockEntrySchema.index({ vendor: 1, createdAt: -1 });

const StockEntry = mongoose.model('StockEntry', stockEntrySchema);

module.exports = { StockEntry };


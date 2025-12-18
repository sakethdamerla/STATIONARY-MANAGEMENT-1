const mongoose = require('mongoose');

// Stock transfer item schema - for multiple products in a transfer
const transferItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Product',
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
    },
  },
  { _id: false }
);

// Stock transfer schema - transfers FROM central stock TO colleges
const stockTransferSchema = new mongoose.Schema(
  {
    // Support multiple products in a single transfer
    items: {
      type: [transferItemSchema],
      required: [true, 'Please provide at least one product'],
      validate: {
        validator: function(v) {
          if (!Array.isArray(v) || v.length === 0) {
            return false;
          }
          // Check for duplicate products in the same transfer
          const productIds = v.map(item => item.product?.toString()).filter(Boolean);
          const uniqueProductIds = new Set(productIds);
          return productIds.length === uniqueProductIds.size;
        },
        message: 'At least one product is required and each product can only appear once per transfer',
      },
    },
    toCollege: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Please provide destination college'],
      ref: 'College',
    },
    fromCollege: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // Null means Central Warehouse
      ref: 'College',
    },
    transferDate: {
      type: Date,
      default: Date.now,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
    deductFromCentral: {
      type: Boolean,
      default: true,
    },
    includeInRevenue: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
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
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    completedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
stockTransferSchema.index({ 'items.product': 1, createdAt: -1 });
stockTransferSchema.index({ toCollege: 1 });
stockTransferSchema.index({ status: 1, createdAt: -1 });
stockTransferSchema.index({ transferDate: -1 });
stockTransferSchema.index({ transactionId: 1 });
stockTransferSchema.index({ isPaid: 1 });

const StockTransfer = mongoose.model('StockTransfer', stockTransferSchema);

module.exports = { StockTransfer };

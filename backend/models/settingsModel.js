const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    // Application branding (used on HomePage, Login, etc.)
    appName: {
      type: String,
      default: 'A PYDAHSOFT PRODUCT',
      trim: true,
    },
    appSubheader: {
      type: String,
      default: 'Stationery Management System',
      trim: true,
    },
    // Receipt headers (used on receipts and PDFs)
    receiptHeader: {
      type: String,
      default: 'PYDAH GROUP OF INSTITUTIONS',
      trim: true,
    },
    receiptSubheader: {
      type: String,
      default: 'Stationery Management System',
      trim: true,
    },
  },
  { timestamps: true }
);

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = { Settings };


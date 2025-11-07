const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    receiptHeader: {
      type: String,
      default: 'PYDAH COLLEGE OF ENGINEERING',
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


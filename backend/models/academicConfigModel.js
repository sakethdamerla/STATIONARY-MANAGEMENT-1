const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
    displayName: { type: String, required: true, trim: true },
    years: { type: [Number], default: [1] },
    branches: { type: [String], default: [] },
    // Course-specific receipt header settings
    receiptHeader: { 
      type: String, 
      trim: true,
      default: '' 
    },
    receiptSubheader: { 
      type: String, 
      trim: true,
      default: '' 
    },
  },
  { _id: true }
);

const academicConfigSchema = new mongoose.Schema(
  {
    courses: { type: [courseSchema], default: [] },
  },
  { timestamps: true }
);

// We will keep a single document
const AcademicConfig = mongoose.model('AcademicConfig', academicConfigSchema);

module.exports = { AcademicConfig };



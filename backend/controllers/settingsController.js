const asyncHandler = require('express-async-handler');
const { Settings } = require('../models/settingsModel');
const { AcademicConfig } = require('../models/academicConfigModel');

const ensureSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
};

const getSettings = asyncHandler(async (req, res) => {
  const { course } = req.query; // Optional course parameter for receipt settings
  
  const settings = await ensureSettings();
  
  // If course is specified, try to get course-specific receipt settings
  if (course) {
    const normalizeCourse = (value) => {
      if (!value) return '';
      return String(value).trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    };
    
    const normalizedCourse = normalizeCourse(course);
    const academicConfig = await AcademicConfig.findOne({});
    
    if (academicConfig) {
      const courseConfig = academicConfig.courses.find(
        c => normalizeCourse(c.name) === normalizedCourse
      );
      
      // If course config exists, use course-specific receipt headers with fallback to global
      if (courseConfig) {
        return res.json({
          // App branding (always from global settings)
          appName: settings.appName || settings.receiptHeader,
          appSubheader: settings.appSubheader || settings.receiptSubheader,
          // Receipt settings (course-specific if configured)
          receiptHeader: courseConfig.receiptHeader || settings.receiptHeader,
          receiptSubheader: courseConfig.receiptSubheader || settings.receiptSubheader,
          updatedAt: academicConfig.updatedAt,
          course: courseConfig.name,
        });
      }
    }
  }
  
  // Return all settings (app branding + receipt settings)
  res.json({
    appName: settings.appName || settings.receiptHeader,
    appSubheader: settings.appSubheader || settings.receiptSubheader,
    receiptHeader: settings.receiptHeader,
    receiptSubheader: settings.receiptSubheader,
    updatedAt: settings.updatedAt,
  });
});

const updateSettings = asyncHandler(async (req, res) => {
  const { appName, appSubheader, receiptHeader, receiptSubheader } = req.body || {};
  const settings = await ensureSettings();

  // Update app branding
  if (appName !== undefined) {
    settings.appName = String(appName).trim();
  }

  if (appSubheader !== undefined) {
    settings.appSubheader = String(appSubheader).trim();
  }

  // Update receipt headers
  if (receiptHeader !== undefined) {
    settings.receiptHeader = String(receiptHeader).trim();
  }

  if (receiptSubheader !== undefined) {
    settings.receiptSubheader = String(receiptSubheader).trim();
  }

  await settings.save();

  res.json({
    appName: settings.appName || settings.receiptHeader,
    appSubheader: settings.appSubheader || settings.receiptSubheader,
    receiptHeader: settings.receiptHeader,
    receiptSubheader: settings.receiptSubheader,
    updatedAt: settings.updatedAt,
  });
});

module.exports = { getSettings, updateSettings };


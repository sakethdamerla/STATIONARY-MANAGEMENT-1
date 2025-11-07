const asyncHandler = require('express-async-handler');
const { Settings } = require('../models/settingsModel');

const ensureSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
};

const getSettings = asyncHandler(async (req, res) => {
  const settings = await ensureSettings();
  res.json({
    receiptHeader: settings.receiptHeader,
    receiptSubheader: settings.receiptSubheader,
    updatedAt: settings.updatedAt,
  });
});

const updateSettings = asyncHandler(async (req, res) => {
  const { receiptHeader, receiptSubheader } = req.body || {};
  const settings = await ensureSettings();

  if (receiptHeader !== undefined) {
    settings.receiptHeader = String(receiptHeader).trim();
  }

  if (receiptSubheader !== undefined) {
    settings.receiptSubheader = String(receiptSubheader).trim();
  }

  await settings.save();

  res.json({
    receiptHeader: settings.receiptHeader,
    receiptSubheader: settings.receiptSubheader,
    updatedAt: settings.updatedAt,
  });
});

module.exports = { getSettings, updateSettings };


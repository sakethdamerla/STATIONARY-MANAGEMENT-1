const asyncHandler = require('express-async-handler');
const { AcademicConfig } = require('../models/academicConfigModel');

// Ensure singleton config
async function getSingleton() {
  let cfg = await AcademicConfig.findOne({});
  if (!cfg) cfg = await AcademicConfig.create({ courses: [] });
  return cfg;
}

// GET /api/config/academic
const getAcademicConfig = asyncHandler(async (req, res) => {
  const cfg = await getSingleton();
  res.json(cfg);
});

// PUT /api/config/academic
const upsertAcademicConfig = asyncHandler(async (req, res) => {
  const { courses } = req.body || {};
  if (!Array.isArray(courses)) {
    res.status(400);
    throw new Error('`courses` must be an array');
  }
  const cfg = await getSingleton();
  cfg.courses = courses.map(c => ({
    name: String(c.name || '').toLowerCase().trim(),
    displayName: String(c.displayName || c.name || '').trim(),
    years: Array.from(new Set((c.years || []).map(Number))).filter(Boolean).sort((a, b) => a - b),
    branches: Array.from(new Set((c.branches || []).map(String))),
    receiptHeader: String(c.receiptHeader || '').trim(),
    receiptSubheader: String(c.receiptSubheader || '').trim(),
  }));
  await cfg.save();
  res.json(cfg);
});

module.exports = { getAcademicConfig, upsertAcademicConfig };

// Additional CRUD for courses collection inside singleton config

// GET /api/academic-config/courses
const listCourses = asyncHandler(async (req, res) => {
  const cfg = await getSingleton();
  let courses = cfg.courses;

  // Filter for Sub-Admins assigned to a college
  if (req.user && req.user.role !== 'Administrator' && req.user.assignedCollege) {
    const { College } = require('../models/collegeModel');
    const assignedCollege = await College.findById(req.user.assignedCollege);
    
    if (assignedCollege && assignedCollege.courses && assignedCollege.courses.length > 0) {
       // Filter courses where course.name is in assignedCollege.courses
       courses = courses.filter(c => assignedCollege.courses.includes(c.name));
    }
  }

  res.json(courses);
});

// POST /api/academic-config/courses
const createCourse = asyncHandler(async (req, res) => {
  const { name, code, displayName, years = [1], branches = [] } = req.body || {};
  const normalizedCode = String(code || name || '').trim().toLowerCase();
  const normalizedName = String(name || displayName || code || '').trim();
  if (!normalizedCode || !normalizedName) {
    res.status(400);
    throw new Error('Course name/code is required');
  }
  const cfg = await getSingleton();
  if (cfg.courses.some(c => c.name === normalizedCode)) {
    res.status(400);
    throw new Error('Course already exists');
  }
  const { receiptHeader = '', receiptSubheader = '' } = req.body || {};
  cfg.courses.push({
    name: normalizedCode,
    displayName: normalizedName,
    years: Array.from(new Set((years || []).map(Number))).filter(Boolean).sort((a, b) => a - b),
    branches: Array.from(new Set((branches || []).map(String))),
    receiptHeader: String(receiptHeader).trim(),
    receiptSubheader: String(receiptSubheader).trim(),
  });
  await cfg.save();
  const saved = cfg.courses[cfg.courses.length - 1];
  res.status(201).json(saved);
});

// DELETE /api/academic-config/courses/:id
const deleteCourse = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const cfg = await getSingleton();
  const before = cfg.courses.length;
  cfg.courses = cfg.courses.filter(c => String(c._id) !== String(id));
  if (cfg.courses.length === before) {
    res.status(404);
    throw new Error('Course not found');
  }
  await cfg.save();
  res.json({ message: 'Deleted' });
});

module.exports = { getAcademicConfig, upsertAcademicConfig, listCourses, createCourse, deleteCourse };



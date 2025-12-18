const asyncHandler = require('express-async-handler');
const { SubAdmin } = require('../models/subAdminModel');

// GET /api/subadmins
const listSubAdmins = asyncHandler(async (req, res) => {
  const subadmins = await SubAdmin.find({})
    .populate('assignedCollege', 'name')
    .populate('assignedBranch', 'name')
    .select('-password');
    
  res.json(subadmins.map(sa => {
    // Resolve the assigned college from either field
    const college = sa.assignedCollege || sa.assignedBranch;
    
    return { 
      _id: sa._id, 
      name: sa.name, 
      role: sa.role, 
      permissions: sa.permissions || [], 
      assignedCollege: college,
      assignedBranch: college // Keep for frontend compatibility
    };
  }));
});

// POST /api/subadmins
const createSubAdmin = asyncHandler(async (req, res) => {
  const { name, password, role, permissions, assignedCollege, assignedBranch } = req.body;
  
  // Accept either assignedCollege or assignedBranch (legacy)
  const targetCollege = assignedCollege || assignedBranch;

  if (!name || !password) {
    res.status(400);
    throw new Error('Name and password are required');
  }
  const exists = await SubAdmin.findOne({ name });
  if (exists) {
    res.status(400);
    throw new Error('Sub-admin with this name already exists');
  }
  const created = await SubAdmin.create({ name, password, role, permissions: permissions || [], assignedCollege: targetCollege || null });
  await created.populate('assignedCollege', 'name');
  
  res.status(201).json({ 
    _id: created._id, 
    name: created.name, 
    role: created.role, 
    permissions: created.permissions, 
    assignedCollege: created.assignedCollege,
    assignedBranch: created.assignedCollege 
  });
});

// PUT /api/subadmins/:id
const updateSubAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, password, role, permissions, assignedCollege, assignedBranch } = req.body;
  const sub = await SubAdmin.findById(id).select('+password');
  if (!sub) {
    res.status(404);
    throw new Error('Sub-admin not found');
  }
  if (name) sub.name = name;
  if (role) sub.role = role;
  if (password) sub.password = password; // will be hashed by pre-save
  if (permissions !== undefined) sub.permissions = permissions;
  
  // Check both new and old field names
  if (assignedCollege !== undefined) sub.assignedCollege = assignedCollege;
  else if (assignedBranch !== undefined) sub.assignedCollege = assignedBranch; // Legacy support

  const saved = await sub.save();
  await saved.populate('assignedCollege', 'name');
  res.json({ 
    _id: saved._id, 
    name: saved.name, 
    role: saved.role, 
    permissions: saved.permissions, 
    assignedCollege: saved.assignedCollege,
    assignedBranch: saved.assignedCollege
  });
});

// DELETE /api/subadmins/:id
const deleteSubAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const sub = await SubAdmin.findById(id);
  if (!sub) {
    res.status(404);
    throw new Error('Sub-admin not found');
  }
  await SubAdmin.findByIdAndDelete(id);
  res.json({ message: 'Deleted' });
});

// POST /api/subadmins/login
const loginSubAdmin = asyncHandler(async (req, res) => {
  const { name, password } = req.body;
  const sub = await SubAdmin.findOne({ name }).select('+password');
  if (!sub) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  const ok = await sub.comparePassword(password);
  if (!ok) {
    res.status(401);
    throw new Error('Invalid credentials');
  }
  await sub.populate('assignedCollege', 'name');
  res.json({ 
    _id: sub._id, 
    name: sub.name, 
    role: sub.role, 
    permissions: sub.permissions || [], 
    assignedCollege: sub.assignedCollege,
    assignedBranch: sub.assignedCollege
  });
});

module.exports = {
  listSubAdmins,
  createSubAdmin,
  updateSubAdmin,
  deleteSubAdmin,
  loginSubAdmin,
};

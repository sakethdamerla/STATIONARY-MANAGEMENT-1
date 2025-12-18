require('dotenv').config();
const mongoose = require('mongoose');
const { College } = require('../models/collegeModel');

const colleges = [
  {
    name: 'Pydah College of Engineering',
    location: 'PATAVALA',
    description: 'Main Engineering Campus',
    isActive: true,
    
  },
  {
    name: 'Pydah Polytechnic College',
    location: 'PATAVALA',
    description: 'Polytechnic Campus',
    isActive: true,
    
  },
  {
    name: 'Pydah Degree College',
    location: 'PATAVALA',
    description: 'Arts & Science Campus',
    isActive: true,
    
  },
  {
    name : 'Pydah Pharmacy College',
    location: 'PATAVALA',
    description : 'Pharmacy Campus',
    isActive : true,
    

  }
];

async function connect() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI environment variable is not set.');
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
  });
  console.log('Connected to MongoDB');
}

async function seedColleges() {
  try {
    await connect();

    console.log(`Clearing existing colleges...`);
    // Optional: clear existing colleges if you want a fresh start, or just upsert.
    // For safety, I'll use upsert logic based on name to avoid duplicates but keep IDs if possible?
    // Actually, simple seeding often clears or checks existence.
    // I'll check existence and create if not exists.

    let createdCount = 0;
    
    for (const collegeData of colleges) {
      const existing = await College.findOne({ name: collegeData.name });
      if (existing) {
        console.log(`College "${collegeData.name}" already exists. Updating...`);
        // Update fields if needed
        existing.location = collegeData.location;
        existing.description = collegeData.description;
        existing.courses = collegeData.courses;
        // stock is preserved
        await existing.save();
      } else {
        await College.create(collegeData);
        createdCount++;
        console.log(`Created college "${collegeData.name}"`);
      }
    }

    console.log(`Seeding completed. Created ${createdCount} new colleges.`);

  } catch (error) {
    console.error('Failed to seed colleges:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

seedColleges();

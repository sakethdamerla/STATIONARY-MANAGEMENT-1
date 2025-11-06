const mongoose = require('mongoose');

// Store connections for different databases
const connections = {};

/**
 * Get or create a connection to a course-specific database
 */
const getCourseConnection = async (course) => {
  // Normalize course name for database naming
  const dbName = course.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  if (connections[dbName]) {
    return connections[dbName];
  }

  try {
    const baseUri = process.env.MONGO_URI;
    if (!baseUri) {
      throw new Error('MONGO_URI environment variable is not set');
    }

    // Create course-specific database URI
    const courseUri = baseUri.replace(/\/[^\/]*$/, `/${dbName}`);
    
    console.log(`Connecting to course database: ${dbName}`);
    
    const conn = await mongoose.createConnection(courseUri, {
      serverSelectionTimeoutMS: 10000,
    });

    connections[dbName] = conn;
    console.log(`Course database connected: ${dbName}`);
    
    return conn;
  } catch (error) {
    console.error(`Error connecting to course database ${dbName}:`, error.message);
    throw error;
  }
};

/**
 * Establishes a connection to the main MongoDB database.
 */
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI environment variable is not set');
    }
    
    // Mongoose.connect returns a promise. Provide some sensible options and a timeout so failures are reported quickly.
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10s timeout for faster failure
    });

    console.log(`MongoDB Connected ✅`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    if (error.stack) console.error(error.stack);
    // Provide a hint about common Atlas issues
    console.error('Common causes: incorrect URI, network/IP not whitelisted in Atlas, or incorrect credentials.');
    // Exit process with failure
    process.exit(1);
  }
};

module.exports = { connectDB, getCourseConnection };                                             
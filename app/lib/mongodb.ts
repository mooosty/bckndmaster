import mongoose from 'mongoose';

declare global {
  var mongoose: {
    conn: mongoose.Mongoose | null;
    promise: Promise<mongoose.Mongoose> | null;
  };
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB(): Promise<mongoose.Mongoose> {
  if (cached.conn) {
    console.log('Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 5000,
      // Explicitly set DNS settings
      family: 4, // Force IPv4
      maxPoolSize: 10,
    };

    console.log('Creating new MongoDB connection...');
    try {
      cached.promise = mongoose.connect(MONGODB_URI!, opts);
    } catch (error) {
      console.error('Initial connection error:', error);
      throw error;
    }
  } else {
    console.log('Using existing MongoDB connection promise');
  }

  try {
    const conn = await cached.promise;
    cached.conn = mongoose;
    console.log('MongoDB connected successfully');
  } catch (e) {
    cached.promise = null;
    console.error('MongoDB connection error:', e);
    throw e;
  }

  return mongoose;
}

export default connectDB; 
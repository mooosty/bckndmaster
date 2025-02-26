import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

interface Connection {
  isConnected?: number;
}

const connection: Connection = {};

async function dbConnect() {
  if (connection.isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI);
    connection.isConnected = db.connections[0].readyState;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Task Schema
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  platform: {
    type: String,
    required: [true, 'Platform is required'],
    trim: true
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  priority: {
    type: String,
    enum: {
      values: ['LOW', 'MEDIUM', 'HIGH'],
      message: '{VALUE} is not a valid priority level'
    },
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: {
      values: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
      message: '{VALUE} is not a valid status'
    },
    default: 'PENDING'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes
taskSchema.index({ projectId: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ deadline: 1 });

// Update timestamp middleware
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create Task model
export const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

export default dbConnect;
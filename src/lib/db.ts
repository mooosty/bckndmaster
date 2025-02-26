import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chronoforge';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // Clear all models before connecting
    Object.keys(mongoose.models).forEach(modelName => {
      delete mongoose.models[modelName];
    });

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Project Schema
const projectSchema = new mongoose.Schema({
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
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required']
  },
  status: {
    type: String,
    enum: ['COMING_SOON', 'OPEN', 'IN_PROGRESS', 'COMPLETED'],
    default: 'COMING_SOON'
  }
}, {
  timestamps: true
});

// Application Schema
const applicationSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  answers: [{
    type: String,
    required: [true, 'Answers are required']
  }],
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
    default: 'PENDING'
  }
}, {
  timestamps: true
});

// Task Schema
const taskSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
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
  platform: {
    type: String,
    required: [true, 'Platform is required'],
    trim: true
  },
  deliverables: [{
    type: String,
    required: [true, 'At least one deliverable is required']
  }],
  status: {
    type: String,
    enum: ['PENDING', 'NEGOTIATION', 'IN_PROGRESS', 'SUBMITTED', 'ACCEPTED', 'DECLINED'],
    default: 'PENDING'
  },
  submission: {
    link: String,
    description: String
  }
}, {
  timestamps: true
});

// TaskModification Schema
const taskModificationSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: [true, 'Task ID is required']
  },
  proposedChanges: {
    title: String,
    description: String,
    deliverables: [String],
    platform: String
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  comments: String,
  requestedBy: {
    type: String,
    required: [true, 'Requester is required']
  }
}, {
  timestamps: true,
  versionKey: false
});

// Chat Message Schema
const chatMessageSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  sender: {
    type: String,
    required: [true, 'Sender is required']
  },
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  messageType: {
    type: String,
    enum: ['GENERAL', 'TASK_DISCUSSION', 'MODIFICATION_REQUEST', 'APPROVAL', 'REJECTION', 'SYSTEM'],
    default: 'GENERAL'
  },
  relatedTaskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
applicationSchema.index({ projectId: 1, userId: 1 }, { 
  unique: true,
  partialFilterExpression: { status: 'PENDING' }
});

taskSchema.index({ projectId: 1, userId: 1 });
taskSchema.index({ status: 1 });
taskModificationSchema.index({ taskId: 1, status: 1 });
chatMessageSchema.index({ projectId: 1, createdAt: 1 });
chatMessageSchema.index({ relatedTaskId: 1 }, { sparse: true });

// Initialize and export models
const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);
const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
const TaskModification = mongoose.models.TaskModification || mongoose.model('TaskModification', taskModificationSchema);
const ChatMessage = mongoose.models.ChatMessage || mongoose.model('ChatMessage', chatMessageSchema);

export { Project, Application, Task, TaskModification, ChatMessage };
export default dbConnect; 
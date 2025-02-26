import mongoose from 'mongoose';

// Define the schema
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  platform: {
    type: String,
    required: [true, 'Platform is required'],
    enum: {
      values: ['Twitter', 'Discord', 'Telegram', 'Other'],
      message: '{VALUE} is not a valid platform'
    }
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required']
  },
  userId: {
    type: String,
    required: [true, 'Assigned user email is required'],
    trim: true
  },
  createdBy: {
    type: String,
    required: [true, 'Creator email is required'],
    trim: true
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  priority: {
    type: String,
    enum: {
      values: ['Low', 'Medium', 'High'],
      message: '{VALUE} is not a valid priority level'
    },
    default: 'Medium'
  },
  status: {
    type: String,
    enum: {
      values: ['Todo', 'In Progress', 'Completed'],
      message: '{VALUE} is not a valid status'
    },
    default: 'Todo'
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

// Indexes
taskSchema.index({ projectId: 1 });
taskSchema.index({ userId: 1 });
taskSchema.index({ status: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ deadline: 1 });

// Update timestamp middleware
taskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// TypeScript interface
export interface ITask extends mongoose.Document {
  title: string;
  description: string;
  platform: string;
  projectId: mongoose.Types.ObjectId;
  userId: string;
  createdBy: string;
  deadline: Date;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Todo' | 'In Progress' | 'Completed';
  createdAt: Date;
  updatedAt: Date;
}

// Create and export the model
const Task = mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);
export default Task; 
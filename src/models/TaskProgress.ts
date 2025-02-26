import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskProgress extends Document {
  userId: string;
  projectId: string;
  tasks: {
    taskId: string;
    type: 'discord' | 'social';
    status: 'pending' | 'pending_approval' | 'completed';
    completedAt?: Date;
    submission?: string;
    subtasks?: {
      subtaskId: string;
      completed: boolean;
      completedAt?: Date;
    }[];
  }[];
  totalPoints: number;
  completedTasks: number;
  createdAt: Date;
  updatedAt: Date;
}

const TaskProgressSchema: Schema = new Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  projectId: {
    type: String,
    required: [true, 'Project ID is required']
  },
  tasks: [{
    taskId: {
      type: String,
      required: [true, 'Task ID is required']
    },
    type: {
      type: String,
      enum: ['discord', 'social'],
      required: [true, 'Task type is required']
    },
    status: {
      type: String,
      enum: ['pending', 'pending_approval', 'completed'],
      default: 'pending'
    },
    completedAt: {
      type: Date
    },
    submission: {
      type: String
    },
    subtasks: [{
      subtaskId: {
        type: String,
        required: true
      },
      completed: {
        type: Boolean,
        default: false
      },
      completedAt: {
        type: Date
      }
    }]
  }],
  totalPoints: {
    type: Number,
    default: 0
  },
  completedTasks: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Create a compound index for userId and projectId
TaskProgressSchema.index({ userId: 1, projectId: 1 }, { unique: true });

// Delete existing model if it exists
if (mongoose.models.TaskProgress) {
  delete mongoose.models.TaskProgress;
}

export default mongoose.model<ITaskProgress>('TaskProgress', TaskProgressSchema); 
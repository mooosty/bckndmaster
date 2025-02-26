import mongoose, { Schema, Document } from 'mongoose';

export interface ITask extends Document {
  projectId: string;
  title: string;
  description: string;
  deadline: string;
  priority: string;
  status: string;
  userId: string;
  createdBy: string;
  submission?: {
    link: string;
    description: string;
    status: string;
    submittedAt: Date | null;
    feedback: string;
    lastUpdated: Date | null;
  };
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema: Schema = new Schema({
  projectId: {
    type: String,
    required: [true, 'Project ID is required']
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
  deadline: {
    type: String,
    required: [true, 'Deadline is required']
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED'],
    default: 'PENDING'
  },
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  createdBy: {
    type: String,
    required: [true, 'Creator ID is required']
  },
  submission: {
    type: {
      link: { type: String, default: '' },
      description: { type: String, default: '' },
      status: { type: String, default: 'pending' },
      submittedAt: { type: Date, default: null },
      feedback: { type: String, default: '' },
      lastUpdated: { type: Date, default: null }
    },
    default: {
      link: '',
      description: '',
      status: 'pending',
      submittedAt: null,
      feedback: '',
      lastUpdated: null
    }
  }
}, {
  timestamps: true
});

// Delete existing model if it exists
if (mongoose.models.Task) {
  delete mongoose.models.Task;
}

export default mongoose.model<ITask>('Task', TaskSchema); 
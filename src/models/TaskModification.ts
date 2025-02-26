import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskModification extends Document {
  taskId: mongoose.Types.ObjectId;
  proposedChanges: {
    title?: string;
    description?: string;
    deliverables?: string[];
    platform?: string;
  };
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string;
  requestedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskModificationSchema: Schema = new Schema({
  taskId: {
    type: Schema.Types.ObjectId,
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

// Indexes
TaskModificationSchema.index({ taskId: 1, status: 1 });

export default mongoose.models.TaskModification || mongoose.model<ITaskModification>('TaskModification', TaskModificationSchema); 
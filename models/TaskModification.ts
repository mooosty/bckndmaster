import mongoose, { Schema, Document } from 'mongoose';

export interface ITaskModification extends Document {
  taskId: mongoose.Types.ObjectId;
  proposedChanges: {
    title?: string;
    description?: string;
    deliverables?: string[];
    platform?: string;
  };
  comments: string;
  requestedBy: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

const TaskModificationSchema: Schema = new Schema({
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: true
  },
  proposedChanges: {
    title: String,
    description: String,
    deliverables: [String],
    platform: String
  },
  comments: {
    type: String,
    required: true
  },
  requestedBy: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  }
}, {
  timestamps: true
});

export default mongoose.models.TaskModification || mongoose.model<ITaskModification>('TaskModification', TaskModificationSchema); 
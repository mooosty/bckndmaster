import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: string;
  sender: string;
  content: string;
  messageType: 'GENERAL' | 'TASK_DISCUSSION' | 'MODIFICATION_REQUEST' | 'APPROVAL' | 'REJECTION' | 'SYSTEM';
  relatedTaskId?: mongoose.Types.ObjectId;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema: Schema = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
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
    type: Schema.Types.ObjectId,
    ref: 'Task'
  },
  metadata: Schema.Types.Mixed
}, {
  timestamps: true,
  versionKey: false
});

// Indexes
ChatMessageSchema.index({ projectId: 1, createdAt: 1 });
ChatMessageSchema.index({ relatedTaskId: 1 }, { sparse: true });

export default mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema); 
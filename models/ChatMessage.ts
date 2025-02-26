import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  content: string;
  sender: string;
  timestamp: Date;
  type: 'GENERAL' | 'TASK' | 'SYSTEM';
  projectId?: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  readBy: string[];
}

const ChatMessageSchema = new Schema<IChatMessage>({
  content: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true
  },
  sender: {
    type: String,
    required: [true, 'Sender is required']
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['GENERAL', 'TASK', 'SYSTEM'],
    default: 'GENERAL'
  },
  projectId: {
    type: Schema.Types.ObjectId,
    ref: 'Project',
    required: false
  },
  taskId: {
    type: Schema.Types.ObjectId,
    ref: 'Task',
    required: false
  },
  readBy: [{
    type: String,
    default: []
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
ChatMessageSchema.index({ projectId: 1, timestamp: -1 });
ChatMessageSchema.index({ taskId: 1, timestamp: -1 });
ChatMessageSchema.index({ sender: 1 });
ChatMessageSchema.index({ type: 1 });

// Ensure either projectId or taskId is provided
ChatMessageSchema.pre('save', function(next) {
  if (!this.projectId && !this.taskId) {
    next(new Error('Either projectId or taskId must be provided'));
  } else {
    next();
  }
});

// Virtual for checking if message is read by a user
ChatMessageSchema.virtual('isReadBy').get(function(this: IChatMessage) {
  return (userId: string) => this.readBy.includes(userId);
});

export default mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema); 
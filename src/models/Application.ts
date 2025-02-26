import mongoose, { Schema, Document } from 'mongoose';

export interface IApplication extends Document {
  projectId: mongoose.Types.ObjectId;
  userId: string;
  answers: string[];
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema({
  projectId: {
    type: Schema.Types.ObjectId,
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
  timestamps: true,
  versionKey: false
});

// Unique index on projectId and userId for pending applications
ApplicationSchema.index({ projectId: 1, userId: 1 }, { 
  unique: true,
  partialFilterExpression: { status: 'PENDING' }
});

export default mongoose.models.Application || mongoose.model<IApplication>('Application', ApplicationSchema); 
import mongoose, { Schema } from 'mongoose';

const projectSchema = new Schema({
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

// Update the updatedAt timestamp before saving
projectSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Check if the model exists before creating it
const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

export default Project; 
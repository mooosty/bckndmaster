import mongoose, { Schema, Document } from 'mongoose';

export interface IUserCollaboration extends Document {
  userId: string;
  projectId: string;
  status: 'pending' | 'approved' | 'rejected';
  about: string;
  collaboration: string;
  details?: {
    languages?: { [key: string]: boolean };
    niches?: { [key: string]: boolean | string };
    main_ecosystem?: { [key: string]: boolean };
    audience_type?: { [key: string]: boolean | string };
    main_socials?: {
      [key: string]: {
        handle: string;
        audience_count: string;
      };
    };
    description?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserCollaborationSchema: Schema = new Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required'],
    trim: true
  },
  projectId: {
    type: String,
    required: [true, 'Project ID is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    required: true
  },
  about: {
    type: String,
    required: false,
    trim: true
  },
  collaboration: {
    type: String,
    required: false,
    trim: true
  },
  details: {
    type: {
      languages: {
        type: Map,
        of: Boolean,
        required: true
      },
      niches: {
        type: Map,
        of: Schema.Types.Mixed,
        required: true
      },
      main_ecosystem: {
        type: Map,
        of: Boolean,
        required: true
      },
      audience_type: {
        type: Map,
        of: Schema.Types.Mixed,
        required: true
      },
      main_socials: {
        type: Map,
        of: new Schema({
          handle: String,
          audience_count: String
        }, { _id: false }),
        required: true
      },
      description: {
        type: String,
        required: true
      }
    },
    required: true
  }
}, {
  timestamps: true,
  strict: true,
  strictQuery: true
});

// Create a compound index for userId and projectId
UserCollaborationSchema.index({ userId: 1, projectId: 1 }, { unique: true });

// Clear existing models to prevent OverwriteModelError
Object.keys(mongoose.models).forEach(key => {
  delete mongoose.models[key];
});

// Create and export the model
const UserCollaboration = mongoose.model<IUserCollaboration>('UserCollaboration', UserCollaborationSchema);

export default UserCollaboration; 
import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: String,
  role: String,
  twitter: String,
  website: String,
  niches: [String],
  image: String,
});

const investmentProfileSchema = new mongoose.Schema({
  isInvestor: String,
  roundTypes: [String],
  ticketSize: [String],
});

const twitterAuthSchema = new mongoose.Schema({
  accessToken: String,
  refreshToken: String,
  username: String,
  id: String,
  verified: { type: Boolean, default: false },
  lastVerified: Date,
  profileImageUrl: String,
  bio: String
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  firstname: { type: String },
  lastname: { type: String },
  name: { type: String },  // We'll handle the name concatenation in the pre-save hook
  dynamicId: { type: String, index: true }, // Add dynamicId field to store the Dynamic authentication ID
  primary_city: { type: String },
  secondary_city: [String],
  roles: [String],
  projects: [projectSchema],
  isContentCreator: mongoose.Schema.Types.Mixed,
  contentCreatorDescription: String,
  contentPlatforms: [String],
  contentTypes: [String],
  platformLinks: { type: Map, of: String },
  FDV: [String],
  criterias: [String],
  equityOrToken: String,
  investmentProfile: investmentProfileSchema,
  bio: String,
  short_bio: String,
  extensive_bio: String,
  profile_image: String, // Add profile image field
  onboarding_completed: { type: Boolean, default: false },
  onboarding_step: { type: Number, default: 1 },
  status: { type: String, default: 'ACTIVE' },
  goodwill_points: { type: Number, default: 0 },
  collab_points: { type: Number, default: 0 },
  winwin_balance: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  twitter: twitterAuthSchema,
}, {
  timestamps: true
});

// Handle name concatenation in pre-save hook
userSchema.pre('save', function(next) {
  if (this.firstname && this.lastname) {
    this.name = `${this.firstname} ${this.lastname}`;
  }
  next();
});

// Ensure virtuals are included in toObject and toJSON
userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });

// Delete existing model if it exists to prevent OverwriteModelError
if (mongoose.models.User) {
  delete mongoose.models.User;
}

const User = mongoose.model('User', userSchema);

export default User; 
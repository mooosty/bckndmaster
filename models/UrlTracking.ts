import mongoose, { Schema } from 'mongoose';

const urlTrackingSchema = new Schema({
    originalUrl: {
        type: String,
        required: true,
        unique: true
    },
    tinyUrl: {
        type: String,
        required: true
    },
    shortCode: {
        type: String,
        unique: true,
        sparse: true
    },
    clicks: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add indexes
urlTrackingSchema.index({ originalUrl: 1 });
urlTrackingSchema.index({ tinyUrl: 1 });
urlTrackingSchema.index({ shortCode: 1 });

const UrlTracking = mongoose.models.UrlTracking || mongoose.model('UrlTracking', urlTrackingSchema);

export default UrlTracking; 
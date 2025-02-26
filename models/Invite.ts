import mongoose, { Schema, Document } from 'mongoose';
import { IInvite } from '../types/invite';

const inviteSchema = new Schema<IInvite>({
    invitedUser: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    inviteUser: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

inviteSchema.index({ inviteUser: 1 });
inviteSchema.index({ invitedUser: 1 });

export default mongoose.models.Invite || mongoose.model<IInvite>('Invite', inviteSchema); 
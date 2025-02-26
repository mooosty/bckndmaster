# Collabs Referral System Documentation

## System Overview

The Win Win Society referral system is a multi-level referral tracking system that rewards users for inviting others to the platform. The system features:

- 3-level deep referral tracking
- Point distribution across referral levels (100/20/10 points)
- Custom TinyURL link generation for sharing
- Secure token handling and tracking
- MongoDB-backed invite management with Next.js API routes

## Database Schema

### Types Definition
```typescript
// types/invite.ts
export interface IUser {
    _id: string;
    username: string;
    points: number;
    // ... other user fields
}

export interface IInvite {
    _id: string;
    invitedUser: string | IUser;
    inviteUser: string | IUser;
    createdAt: Date;
}

export interface IUrlTracking {
    _id: string;
    originalUrl: string;
    tinyUrl: string;
    clicks: number;
    createdAt: Date;
}
```

### Mongoose Models
```typescript
// models/Invite.ts
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

// Create indexes
inviteSchema.index({ inviteUser: 1 });
inviteSchema.index({ invitedUser: 1 });

export default mongoose.models.Invite || mongoose.model<IInvite>('Invite', inviteSchema);
```

```typescript
// models/UrlTracking.ts
import mongoose, { Schema, Document } from 'mongoose';
import { IUrlTracking } from '../types/invite';

const urlTrackingSchema = new Schema<IUrlTracking>({
    originalUrl: {
        type: String,
        required: true
    },
    tinyUrl: {
        type: String,
        required: true,
        unique: true
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

urlTrackingSchema.index({ tinyUrl: 1 }, { unique: true });

export default mongoose.models.UrlTracking || mongoose.model<IUrlTracking>('UrlTracking', urlTrackingSchema);
```

## API Implementation

### Database Connection
```typescript
// lib/dbConnect.ts
import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(process.env.MONGODB_URI!, opts).then((mongoose) => {
            return mongoose;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

export default dbConnect;
```

### API Routes Implementation

#### Create Invite
```typescript
// app/api/invites/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Invite from '@/models/Invite';
import { auth } from '@/lib/auth';

export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const body = await req.json();

        const invite = await Invite.create({
            invitedUser: body.invitedUser,
            inviteUser: body.inviteUser
        });

        return NextResponse.json(invite);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

#### Get Invite Tree
```typescript
// app/api/invites/tree/[userId]/route.ts
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Invite from '@/models/Invite';

export async function GET(
    req: Request,
    { params }: { params: { userId: string } }
) {
    try {
        await dbConnect();

        // Level 1 - Direct invites
        const level1 = await Invite.find({ inviteUser: params.userId })
            .populate('invitedUser', 'username')
            .lean();

        // Level 2 - Invites of direct invites
        const level2 = await Invite.find({
            inviteUser: { 
                $in: level1.map(invite => (invite.invitedUser as any)._id) 
            }
        }).populate('invitedUser', 'username').lean();

        // Level 3 - Invites of level 2 users
        const level3 = await Invite.find({
            inviteUser: { 
                $in: level2.map(invite => (invite.invitedUser as any)._id) 
            }
        }).populate('invitedUser', 'username').lean();

        return NextResponse.json({
            level1: level1.map(invite => (invite.invitedUser as any).username),
            level2: level2.map(invite => (invite.invitedUser as any).username),
            level3: level3.map(invite => (invite.invitedUser as any).username)
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
```

### Point Distribution Implementation
```typescript
// lib/points.ts
import User from '@/models/User';
import Invite from '@/models/Invite';

export async function updatePoints(data: { invitedUser: string }) {
    let rewardAmount = 100;
    let currentUserId = data.invitedUser;
    
    while (rewardAmount > 0) {
        const inviter = await Invite.findOne({ invitedUser: currentUserId }).lean();
        
        if (inviter) {
            await User.findByIdAndUpdate(
                inviter.inviteUser,
                { $inc: { points: rewardAmount } }
            );
            
            currentUserId = inviter.inviteUser as string;
            if (rewardAmount === 100) rewardAmount = 20;
            else if (rewardAmount === 20) rewardAmount = 10;
            else rewardAmount = 0;
        } else {
            break;
        }
    }
}
```

## Implementation Guide

### Project Setup

1. Create a new Next.js project with TypeScript:
   ```bash
   npx create-next-app@latest --typescript
   ```

2. Install required dependencies:
   ```bash
   npm install mongoose axios @types/mongoose
   ```

3. Set up environment variables in `.env.local`:
   ```
   MONGODB_URI=your_mongodb_uri
   TINYURL_API_KEY=your_api_key
   ```

4. Configure MongoDB connection in `lib/dbConnect.ts`

### Testing Setup

```typescript
// __tests__/invite.test.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Invite from '@/models/Invite';
import { describe, expect, it, beforeAll, afterAll } from '@jest/globals';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('Invite System', () => {
    it('should create new invite', async () => {
        const invite = await Invite.create({
            invitedUser: new mongoose.Types.ObjectId(),
            inviteUser: new mongoose.Types.ObjectId()
        });
        
        expect(invite._id).toBeDefined();
    });
});
```

## Error Handling

```typescript
// lib/errors.ts
export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export function handleMongooseError(error: any) {
    if (error.code === 11000) {
        throw new ApiError(409, 'Duplicate entry');
    }
    if (error.name === 'ValidationError') {
        throw new ApiError(400, 'Validation Error');
    }
    throw new ApiError(500, 'Internal Server Error');
}
```

## Best Practices

1. **Type Safety**
   - Use TypeScript interfaces for all models
   - Implement proper type checking
   - Use type guards where necessary

2. **API Route Organization**
   - Follow Next.js 13+ App Router conventions
   - Implement proper error handling
   - Use middleware for authentication

3. **Performance**
   - Use `lean()` for read operations
   - Implement proper indexing
   - Use proper TypeScript configurations

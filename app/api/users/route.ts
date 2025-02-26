import { NextRequest, NextResponse } from 'next/server';
import { userAuth, isAdmin } from '@/middleware/userAuth';
import dbConnect from '@/lib/db';
import User from '@/src/models/User';

interface AuthResult {
  user: {
    email: string;
    role: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await userAuth(request);
    if (!('user' in authResult)) {
      return authResult as NextResponse;
    }

    const { user } = authResult as AuthResult;

    // Only admin can fetch all users
    if (!isAdmin(user)) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    // Connect to database
    await dbConnect();

    // Fetch all users with completed onboarding
    const users = await User.find({ 
      onboarding_completed: true,
      status: { $ne: 'INACTIVE' } // Exclude inactive users if status is set
    })
      .select('email firstname lastname status')
      .sort({ email: 1 });

    console.log('Found users:', users.length);

    // Transform users for response
    const transformedUsers = users.map(user => {
      const plainUser = user.toObject();
      return {
        id: plainUser._id.toString(),
        email: plainUser.email,
        name: plainUser.firstname && plainUser.lastname 
          ? `${plainUser.firstname} ${plainUser.lastname}`
          : null,
        status: plainUser.status || 'ACTIVE'
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch users'
    }, { status: 500 });
  }
} 
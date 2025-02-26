import { NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import User from '@/src/models/User';
import Invite from '@/models/Invite';

export async function POST(req: Request) {
  try {
    console.log('Connecting to MongoDB for onboarding completion...');
    await connectDB();
    
    const data = await req.json();
    console.log('Received onboarding data:', data);
    
    const { email, ...userData } = data;
    
    if (!email) {
      console.error('No email provided for onboarding completion');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Update user with onboarding completion
    console.log('Updating user onboarding status for email:', email);
    
    const user = await User.findOneAndUpdate(
      { email },
      { 
        ...userData,
        onboarding_completed: true,
        updatedAt: new Date()
      },
      { 
        new: true,
        runValidators: true,
      }
    );

    if (!user) {
      console.error('User not found for onboarding completion:', email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('Onboarding completed for user:', user._id);
    return NextResponse.json({ 
      success: true, 
      message: 'Onboarding completed successfully',
      user: {
        _id: user._id,
        email: user.email,
        onboarding_completed: user.onboarding_completed
      }
    });
  } catch (error: any) {
    console.error('Error completing onboarding:', error);
    console.error('Full error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
    return NextResponse.json({ 
      error: error.message,
      details: error.stack 
    }, { status: 500 });
  }
} 
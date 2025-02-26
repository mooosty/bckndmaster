import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/mongodb';
import User from '@/src/models/User';

export async function POST(req: Request) {
  try {
    console.log('Connecting to MongoDB...');
    await connectDB();
    
    const data = await req.json();
    console.log('Received data:', data);
    
    const { email, ...userData } = data;
    
    if (!email) {
      console.error('No email provided');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Set onboarding_completed to true if we have essential user data
    const shouldCompleteOnboarding = 
      userData.firstname && 
      userData.lastname && 
      userData.primary_city &&
      userData.roles?.length > 0;

    const updatedData = {
      ...userData,
      onboarding_completed: shouldCompleteOnboarding,
      updatedAt: new Date()
    };

    console.log('Finding/updating user with email:', email);
    
    const user = await User.findOneAndUpdate(
      { email },
      updatedData,
      { 
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    console.log('Saved user:', user);
    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error saving user data:', error);
    // Log the full error details
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    console.log('GET /api/user called with email:', email);

    if (!email) {
      console.log('No email provided in request');
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    await connectDB();
    console.log('Connected to database');

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('User not found for email:', email);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User found:', { 
      id: user._id, 
      email: user.email, 
      points: user.points,
      winwin_balance: user.winwin_balance,
      onboarding_completed: user.onboarding_completed 
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error('Error in GET /api/user:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 
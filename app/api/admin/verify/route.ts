import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// In-memory store for rate limiting
const attempts = new Map<string, { count: number; timestamp: number }>();
const MAX_ATTEMPTS = 5;
const TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  // Get authorization header
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the user's IP for rate limiting
  const ip = request.ip || 'unknown';
  
  // Check if user is in timeout
  const userAttempts = attempts.get(ip);
  if (userAttempts) {
    const timeElapsed = Date.now() - userAttempts.timestamp;
    if (userAttempts.count >= MAX_ATTEMPTS && timeElapsed < TIMEOUT_DURATION) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      );
    }
    // Reset attempts if timeout has passed
    if (timeElapsed >= TIMEOUT_DURATION) {
      attempts.delete(ip);
    }
  }

  try {
    const { adminCode } = await request.json();
    
    if (adminCode === process.env.ADMIN_ACCESS_CODE) {
      // Reset attempts on successful login
      attempts.delete(ip);
      
      // Set admin session cookie
      cookies().set('adminAccess', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 // 24 hours
      });
      
      return NextResponse.json({ success: true, message: 'Admin access granted' });
    }

    // Increment failed attempts
    const currentAttempts = attempts.get(ip);
    if (currentAttempts) {
      currentAttempts.count += 1;
      currentAttempts.timestamp = Date.now();
    } else {
      attempts.set(ip, { count: 1, timestamp: Date.now() });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid admin code' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const adminAccess = request.cookies.get('adminAccess');
    console.log('Verify - Admin access cookie:', adminAccess);

    if (!adminAccess || adminAccess.value !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
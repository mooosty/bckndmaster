import { NextRequest, NextResponse } from 'next/server';

interface AuthResult {
  user: {
    email: string;
    role: string;
  };
}

interface AuthError {
  error: string;
  status: number;
}

export async function adminAuth(request: NextRequest): Promise<AuthResult | AuthError> {
  try {
    // Check for admin access in cookies
    const adminAccess = request.cookies.get('adminAccess')?.value;
    if (!adminAccess || adminAccess !== 'true') {
      return { error: 'Admin access required', status: 403 };
    }

    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { error: 'Authentication required', status: 401 };
    }

    // Get email from Bearer token
    const userEmail = authHeader.split(' ')[1];
    if (!userEmail || userEmail !== 'admin@darknightlabs.com') {
      return { error: 'Invalid admin credentials', status: 401 };
    }

    // Return authenticated user info
    return {
      user: {
        email: userEmail,
        role: 'admin'
      }
    };
  } catch (error) {
    console.error('Admin authentication error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
} 
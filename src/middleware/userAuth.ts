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

export async function userAuth(request: NextRequest): Promise<AuthResult | AuthError> {
  try {
    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { error: 'Authentication required', status: 401 };
    }

    // Get email from Bearer token
    const userEmail = authHeader.split(' ')[1];
    if (!userEmail || !userEmail.includes('@')) {
      return { error: 'Invalid user credentials', status: 401 };
    }

    // Return authenticated user info
    return {
      user: {
        email: userEmail,
        role: 'user'
      }
    };
  } catch (error) {
    console.error('User authentication error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
} 
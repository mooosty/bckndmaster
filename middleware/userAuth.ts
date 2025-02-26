import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const ADMIN_EMAIL = 'admin@darknightlabs.com';

interface JWTPayload {
  email: string;
  role?: string;
}

export async function userAuth(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'No authorization token provided' },
        { status: 401 }
      );
    }

    // Extract the token
    const token = authHeader.replace('Bearer ', '');
    
    // For development/testing purposes, allow admin@darknightlabs.com as a direct token
    if (token === ADMIN_EMAIL) {
      return {
        user: {
          email: ADMIN_EMAIL,
          role: 'admin'
        }
      };
    }

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Check if user exists and has required permissions
    if (!decoded || !decoded.email) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Return the user information
    return {
      user: {
        email: decoded.email,
        role: decoded.role || 'user'
      }
    };

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

export function isAdmin(user: { email: string; role?: string }) {
  return user.email === ADMIN_EMAIL || user.role === 'admin';
} 
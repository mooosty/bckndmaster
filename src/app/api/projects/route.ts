import { NextRequest, NextResponse } from 'next/server';
import projectController from '../../../controllers/projectController';
import { userAuth } from '../../../middleware/userAuth';
import { adminAuth } from '../../../middleware/adminAuth';
import dbConnect from '@/lib/db';

// Connect to database
dbConnect();

// List projects (requires user auth)
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await userAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    return projectController.getAll();
  } catch (error) {
    console.error('Error in GET /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create project (requires admin auth)
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin
    const authResult = await adminAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    return projectController.create(request);
  } catch (error) {
    console.error('Error in POST /api/projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Application from '@/models/Application';
import Task from '@/models/Task';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    // Get user email from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required'
      }, { status: 401 });
    }

    const userEmail = authHeader.split(' ')[1];
    if (!userEmail || !userEmail.includes('@')) {
      return NextResponse.json({
        success: false,
        message: 'Invalid authentication token'
      }, { status: 401 });
    }

    // Get user's applications and tasks
    const [applications, tasks] = await Promise.all([
      Application.find({ userId: userEmail }).exec(),
      Task.find({ userId: userEmail }).exec()
    ]);

    return NextResponse.json({
      success: true,
      profile: {
        email: userEmail,
        applications: applications.length,
        activeTasks: tasks.filter(t => !['ACCEPTED', 'DECLINED'].includes(t.status)).length,
        completedTasks: tasks.filter(t => t.status === 'ACCEPTED').length
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  });
} 
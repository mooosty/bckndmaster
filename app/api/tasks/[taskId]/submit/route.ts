import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task from '@/src/models/Task';

export async function POST(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user email from Bearer token
    const userEmail = authHeader.split(' ')[1];
    if (!userEmail || !userEmail.includes('@')) {
      return NextResponse.json({ 
        error: 'Invalid authentication token',
        received_email: userEmail
      }, { status: 401 });
    }

    await dbConnect();

    // Get the task
    const task = await Task.findById(params.taskId);
    if (!task) {
      return NextResponse.json({ 
        success: false,
        error: 'Task not found'
      }, { status: 404 });
    }

    // Verify the task belongs to the user
    if (task.userId !== userEmail) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized to submit this task'
      }, { status: 403 });
    }

    const { link, description } = await request.json();

    // Update task submission
    task.submission = {
      link: link || '',
      description: description || '',
      status: 'pending_approval',
      submittedAt: new Date(),
      feedback: '',
      lastUpdated: new Date()
    };

    // Save the updated task
    await task.save();

    return NextResponse.json({ 
      success: true,
      data: {
        id: task._id,
        submission: task.submission
      }
    });

  } catch (error) {
    console.error('Error submitting task:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to submit task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  });
} 
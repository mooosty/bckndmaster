import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import ChatMessage from '@/models/ChatMessage';

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
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

    // Get verification data from request body
    const { status, isAdmin = false } = await request.json();
    if (!status || !['ACCEPTED', 'DECLINED'].includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Valid status (ACCEPTED or DECLINED) is required'
      }, { status: 400 });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(params.taskId) || 
        !mongoose.Types.ObjectId.isValid(params.projectId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid ID format'
      }, { status: 400 });
    }

    // Find task
    const task = await Task.findOne({
      _id: new mongoose.Types.ObjectId(params.taskId),
      projectId: new mongoose.Types.ObjectId(params.projectId)
    }).exec();

    if (!task) {
      return NextResponse.json({
        success: false,
        message: 'Task not found'
      }, { status: 404 });
    }

    // Verify task is in SUBMITTED state
    if (task.status !== 'SUBMITTED') {
      return NextResponse.json({
        success: false,
        message: `Cannot verify task in ${task.status} status`
      }, { status: 400 });
    }

    // Handle acceptance/rejection
    if (status === 'ACCEPTED') {
      // Update the appropriate acceptance flag
      if (isAdmin) {
        task.acceptance.admin = true;
      } else if (task.userId === userEmail) {
        task.acceptance.user = true;
      } else {
        return NextResponse.json({
          success: false,
          message: 'Unauthorized to accept this task'
        }, { status: 403 });
      }

      // If both user and admin have accepted, update task status
      if (task.acceptance.user && task.acceptance.admin) {
        task.status = 'ACCEPTED';
        task.acceptance.timestamp = new Date();
      }
    } else {
      // If declined by either party, update status immediately
      task.status = 'DECLINED';
    }

    await task.save();

    // Create chat message for the verification
    await ChatMessage.create({
      taskId: task._id,
      sender: userEmail,
      content: `Task ${status.toLowerCase()} by ${isAdmin ? 'admin' : 'user'}`,
      messageType: status === 'ACCEPTED' ? 'APPROVAL' : 'REJECTION'
    });

    return NextResponse.json({
      success: true,
      message: `Task ${status.toLowerCase()}${status === 'ACCEPTED' && !(task.acceptance.user && task.acceptance.admin) ? ' (waiting for other party)' : ''}`,
      task
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error verifying task:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to verify task',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  });
} 
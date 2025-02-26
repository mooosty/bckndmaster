import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import ChatMessage from '@/models/ChatMessage';
import TaskModification from '@/models/TaskModification';

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string; modificationId: string } }
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

    // Get status and comments from request body
    const { status, comments } = await request.json();
    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Valid status (APPROVED or REJECTED) is required'
      }, { status: 400 });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(params.taskId) || 
        !mongoose.Types.ObjectId.isValid(params.projectId) ||
        !mongoose.Types.ObjectId.isValid(params.modificationId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid ID format'
      }, { status: 400 });
    }

    // Find the modification request
    const modification = await TaskModification.findOne({
      _id: new mongoose.Types.ObjectId(params.modificationId),
      taskId: new mongoose.Types.ObjectId(params.taskId)
    }).exec();

    if (!modification) {
      return NextResponse.json({
        success: false,
        message: 'Modification request not found'
      }, { status: 404 });
    }

    // Find the task
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

    // Update modification status
    modification.status = status;
    await modification.save();

    // Create chat message for the response
    await ChatMessage.create({
      projectId: task.projectId,
      taskId: task._id,
      userId: userEmail,
      sender: userEmail,
      content: comments || `Modification request ${status.toLowerCase()}`,
      messageType: status === 'APPROVED' ? 'APPROVAL' : 'REJECTION'
    });

    // If approved, apply the changes to the task
    if (status === 'APPROVED') {
      const { title, description, deliverables, platform } = modification.proposedChanges;
      
      if (title) task.title = title;
      if (description) task.description = description;
      if (deliverables) task.deliverables = deliverables;
      if (platform) task.platform = platform;
      
      task.status = 'IN_PROGRESS';
      await task.save();
    } else {
      // If rejected, set task back to previous state
      task.status = 'PENDING';
      await task.save();
    }

    return NextResponse.json({
      success: true,
      message: `Modification request ${status.toLowerCase()}`,
      modification,
      task
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error handling modification request:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to handle modification request',
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
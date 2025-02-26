import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';
import ChatMessage from '@/models/ChatMessage';
import TaskModification from '@/models/TaskModification';

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    // Connect to database
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

    // Get negotiation data from request body
    const { proposedChanges, comments } = await request.json();
    if (!proposedChanges || !comments) {
      return NextResponse.json({
        success: false,
        message: 'Proposed changes and comments are required'
      }, { status: 400 });
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(params.taskId) || !mongoose.Types.ObjectId.isValid(params.projectId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid task or project ID format'
      }, { status: 400 });
    }

    // Find task and verify ownership
    const task = await Task.findOne({
      _id: new mongoose.Types.ObjectId(params.taskId),
      projectId: new mongoose.Types.ObjectId(params.projectId),
      userId: userEmail
    }).exec();

    if (!task) {
      return NextResponse.json({
        success: false,
        message: 'Task not found or you do not have permission'
      }, { status: 404 });
    }

    // Verify task can enter negotiation
    const negotiableStates = ['PENDING', 'IN_PROGRESS'];
    if (!negotiableStates.includes(task.status)) {
      return NextResponse.json({
        success: false,
        message: `Cannot negotiate task in ${task.status} status`
      }, { status: 400 });
    }

    // Create modification request
    const modification = await TaskModification.create({
      taskId: task._id,
      proposedChanges,
      comments,
      requestedBy: userEmail,
      status: 'PENDING'
    });

    // Create chat message for the modification request
    await ChatMessage.create({
      projectId: task.projectId,
      taskId: task._id,
      userId: userEmail,
      sender: userEmail,
      content: comments,
      messageType: 'MODIFICATION_REQUEST'
    });

    // Update task status to NEGOTIATION
    task.status = 'NEGOTIATION';
    await task.save();

    return NextResponse.json({
      success: true,
      message: 'Task negotiation started',
      modification,
      task
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error starting task negotiation:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to start task negotiation',
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
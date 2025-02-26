import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect, { Task } from '@/lib/db';

// Handle POST requests
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string; taskId: string } }
) {
  try {
    console.log('Submit task endpoint called with params:', params); // Debug log
    
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

    // Get submission data from request body
    const { link, description } = await request.json();
    if (!link || !description) {
      return NextResponse.json({
        success: false,
        message: 'Link and description are required'
      }, { status: 400 });
    }

    console.log('Attempting to find task with:', { // Debug log
      taskId: params.taskId,
      projectId: params.projectId,
      userEmail
    });

    // Validate ObjectId
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

    console.log('Found task:', task); // Debug log

    if (!task) {
      return NextResponse.json({
        success: false,
        message: 'Task not found or you do not have permission to submit'
      }, { status: 404 });
    }

    // Verify task is in a submittable state
    const submittableStates = ['PENDING', 'IN_PROGRESS', 'NEGOTIATION'];
    if (!submittableStates.includes(task.status)) {
      return NextResponse.json({
        success: false,
        message: `Cannot submit task in ${task.status} status`
      }, { status: 400 });
    }

    // Update task with submission
    task.submission = { link, description };
    task.status = 'SUBMITTED';
    await task.save();

    return NextResponse.json({
      success: true,
      message: 'Task submitted successfully',
      task
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error submitting task:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to submit task',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
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
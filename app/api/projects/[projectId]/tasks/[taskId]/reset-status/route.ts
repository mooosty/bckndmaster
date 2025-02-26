import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect, { Task } from '@/lib/db';

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

    // Get status from request body
    const { status } = await request.json();
    if (!status || !['PENDING', 'IN_PROGRESS', 'NEGOTIATION'].includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Valid status (PENDING, IN_PROGRESS, or NEGOTIATION) is required'
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

    // Reset task status and clear acceptance flags
    task.status = status;
    if (task.acceptance) {
      task.acceptance = {
        user: false,
        admin: false
      };
    }
    await task.save();

    return NextResponse.json({
      success: true,
      message: 'Task status reset successfully',
      task
    }, { 
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error resetting task status:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to reset task status',
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
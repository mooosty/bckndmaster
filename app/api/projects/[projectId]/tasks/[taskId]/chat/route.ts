import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import ChatMessage from '@/models/ChatMessage';
import Task from '@/models/Task';

export async function GET(
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

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(params.taskId) || 
        !mongoose.Types.ObjectId.isValid(params.projectId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid ID format'
      }, { status: 400 });
    }

    // Find task to verify it exists
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

    // Get chat messages related to this task
    const messages = await ChatMessage.find({
      projectId: new mongoose.Types.ObjectId(params.projectId),
      $or: [
        { userId: userEmail },
        { messageType: 'SYSTEM' }
      ],
      relatedTaskId: new mongoose.Types.ObjectId(params.taskId)
    })
    .sort({ createdAt: 1 })
    .exec();

    return NextResponse.json({
      success: true,
      messages
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching task chat messages:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch task chat messages',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(
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

    // Get message data from request body
    const { content, messageType = 'GENERAL', metadata = {} } = await request.json();
    if (!content) {
      return NextResponse.json({
        success: false,
        message: 'Message content is required'
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

    // Find task to verify it exists
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

    // Create chat message
    const message = await ChatMessage.create({
      projectId: task.projectId,
      userId: userEmail,
      sender: userEmail,
      content,
      messageType,
      relatedTaskId: task._id,
      metadata
    });

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      chatMessage: message
    }, { status: 201 });
  } catch (error) {
    console.error('Error sending chat message:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to send chat message',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  });
} 
import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import ChatMessage from '@/models/ChatMessage';

// Get chat messages for a project
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
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

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.projectId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid project ID format'
      }, { status: 400 });
    }

    // Find project to verify it exists
    const project = await Project.findById(new mongoose.Types.ObjectId(params.projectId)).exec();
    if (!project) {
      return NextResponse.json({
        success: false,
        message: 'Project not found'
      }, { status: 404 });
    }

    // Get chat messages for this user and project
    const messages = await ChatMessage.find({
      projectId: new mongoose.Types.ObjectId(params.projectId),
      userId: userEmail
    })
    .sort({ createdAt: 1 })
    .exec();

    return NextResponse.json({
      success: true,
      messages
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch chat messages',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Send a new chat message
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
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
    const { content, messageType = 'GENERAL', relatedTaskId = null } = await request.json();
    if (!content) {
      return NextResponse.json({
        success: false,
        message: 'Message content is required'
      }, { status: 400 });
    }

    // Validate project ID
    if (!mongoose.Types.ObjectId.isValid(params.projectId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid project ID format'
      }, { status: 400 });
    }

    // Validate task ID if provided
    if (relatedTaskId && !mongoose.Types.ObjectId.isValid(relatedTaskId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid task ID format'
      }, { status: 400 });
    }

    // Find project to verify it exists
    const project = await Project.findById(new mongoose.Types.ObjectId(params.projectId)).exec();
    if (!project) {
      return NextResponse.json({
        success: false,
        message: 'Project not found'
      }, { status: 404 });
    }

    // Create chat message
    const message = await ChatMessage.create({
      projectId: new mongoose.Types.ObjectId(params.projectId),
      userId: userEmail,
      sender: userEmail,
      content,
      messageType,
      relatedTaskId: relatedTaskId ? new mongoose.Types.ObjectId(relatedTaskId) : undefined
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
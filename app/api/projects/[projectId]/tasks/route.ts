import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';

// Handle GET requests to list tasks
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

    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(params.projectId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid project ID format'
      }, { status: 400 });
    }

    // Find tasks for the project
    const tasks = await Task.find({
      projectId: new mongoose.Types.ObjectId(params.projectId)
    });

    return NextResponse.json({
      success: true,
      tasks
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch tasks'
    }, { status: 500 });
  }
}

// Handle POST requests to create new task
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

    // Validate projectId
    if (!mongoose.Types.ObjectId.isValid(params.projectId)) {
      return NextResponse.json({
        success: false,
        message: 'Invalid project ID format'
      }, { status: 400 });
    }

    const { title, description, platform, deliverables } = await request.json();

    // Validate required fields
    if (!title || !description || !platform || !deliverables || !deliverables.length) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // Create new task
    const task = await Task.create({
      projectId: new mongoose.Types.ObjectId(params.projectId),
      userId: userEmail,
      title,
      description,
      platform,
      deliverables,
      status: 'PENDING'
    });

    return NextResponse.json({
      success: true,
      message: 'Task created successfully',
      task
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create task'
    }, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
} 
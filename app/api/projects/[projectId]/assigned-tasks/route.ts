import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task from '@/src/models/Task';
import Project from '@/src/models/Project';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
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
    
    // Get all tasks assigned to the user for this project
    const tasks = await Task.find({
      projectId: params.projectId,
      userId: userEmail
    }).sort({ createdAt: -1 });

    // Get project details
    const project = await Project.findById(params.projectId);
    if (!project) {
      return NextResponse.json({ 
        error: 'Project not found'
      }, { status: 404 });
    }

    // Transform tasks with project details
    const transformedTasks = tasks.map(task => ({
      id: task._id,
      projectId: task.projectId,
      projectName: project.name,
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      priority: task.priority,
      status: task.status,
      submission: task.submission,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }));

    return NextResponse.json({ 
      success: true,
      data: transformedTasks
    });

  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch assigned tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
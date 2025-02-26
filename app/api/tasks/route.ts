import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task, { ITask } from '@/src/models/Task';
import Project from '@/src/models/Project';
import User from '@/src/models/User';
import TaskProgress from '@/src/models/TaskProgress';

export async function POST(request: NextRequest) {
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
    const data = await request.json();

    // Validate required fields
    const requiredFields = ['projectId', 'title', 'description', 'deadline', 'userId'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({ 
          error: `${field} is required`,
          receivedData: data
        }, { status: 400 });
      }
    }

    // Create task data
    const taskData = {
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      deadline: data.deadline,
      priority: data.priority || 'MEDIUM',
      status: data.status || 'PENDING',
      userId: data.userId,
      createdBy: userEmail
    };

    console.log('Creating task with data:', taskData);

    const task = await Task.create(taskData);
    console.log('Task created successfully:', task._id);

    // Transform task for response
    const transformedTask = {
      id: task._id,
      ...task.toObject(),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };

    return NextResponse.json({ 
      success: true,
      message: "Task created successfully",
      task: transformedTask
    });

  } catch (error) {
    console.error('Task creation error:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create task',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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
    
    // Get all task progress entries for the user
    const taskProgressEntries = await TaskProgress.find({
      userId: userEmail
    }).populate('projectId');

    // Get all unique project IDs from task progress
    const projectIds = Array.from(new Set(taskProgressEntries.map(entry => entry.projectId)));

    // Get all projects to get their task details
    const projects = await Project.find({
      _id: { $in: projectIds }
    });

    // Transform task progress into the required format
    const transformedTasks = taskProgressEntries.flatMap(progress => {
      const project = projects.find(p => (p as any)._id.toString() === progress.projectId.toString());
      if (!project) return [];

      return progress.tasks.filter(task => 
        task.status === 'pending_approval' || task.status === 'completed'
      ).map(task => {
        // Find the original task details from the project
        const taskDetails = project.tasks?.discord?.tasks?.find(t => t.id === task.taskId) ||
                          project.tasks?.social?.tasks?.find(t => t.id === task.taskId);
        
        if (!taskDetails) return null;

        return {
          taskId: task.taskId,
          projectId: project._id,
          projectName: project.name,
          title: taskDetails.title,
          description: taskDetails.description,
          type: task.type,
          status: task.status,
          points: taskDetails.points,
          dueDate: taskDetails.dueDate,
          submission: task.submission ? {
            content: task.submission,
            submittedAt: task.completedAt?.toISOString() || new Date().toISOString(),
            description: '',
            link: ''
          } : undefined,
          completedAt: task.completedAt,
          subtasks: task.subtasks
        };
      }).filter(Boolean);
    });

    return NextResponse.json({ 
      success: true,
      data: transformedTasks
    });

  } catch (error) {
    console.error('Error fetching tasks:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch tasks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TaskProgress from '@/src/models/TaskProgress';
import Project from '@/src/models/Project';

interface ProjectSubtask {
  id: string;
  title: string;
  required: boolean;
}

interface ProjectTask {
  id: string;
  title: string;
  description: string;
  points: number;
  dueDate: string;
  subtasks?: ProjectSubtask[];
}

interface TaskProgressSubtask {
  subtaskId: string;
  completed: boolean;
  completedAt?: Date;
}

interface TaskProgressItem {
  taskId: string;
  type: 'discord' | 'social';
  status: 'pending' | 'pending_approval' | 'completed';
  completedAt?: Date;
  submission?: string;
  subtasks?: TaskProgressSubtask[];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    console.log('Starting GET progress request');
    await dbConnect();

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = authHeader.split(' ')[1];
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskProgress = await TaskProgress.findOne({
      userId: userEmail,
      projectId: params.projectId
    });

    // Return the raw task progress data
    return NextResponse.json({
      success: true,
      data: taskProgress || {
        userId: userEmail,
        projectId: params.projectId,
        tasks: [],
        totalPoints: 0,
        completedTasks: 0
      }
    });
  } catch (error) {
    console.error('Error in GET /api/projects/[projectId]/progress:', error);
    return NextResponse.json({ 
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    await dbConnect();
    console.log('POST progress - Project ID:', params.projectId);
    
    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Get email from Bearer token
    const userEmail = authHeader.split(' ')[1];
    if (!userEmail || !userEmail.includes('@')) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid authentication token'
      }, { status: 401 });
    }

    const data = await request.json();
    console.log('Task submission data:', data);

    const { taskId, type, submission } = data;
    if (!taskId || !type) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields: taskId and type'
      }, { status: 400 });
    }

    let projectObj;
    // Get project to validate task
    const project = await Project.findById(params.projectId);
    if (!project) {
      return NextResponse.json({ 
        success: false,
        error: 'Project not found'
      }, { status: 404 });
    }
    projectObj = project.toObject();

    // Find the task in project
    const taskList: ProjectTask[] = type === 'discord' 
      ? (projectObj.tasks?.discord?.tasks || []) 
      : (projectObj.tasks?.social?.tasks || []);

    const projectTask = taskList.find((t) => t.id === taskId);
    if (!projectTask) {
      return NextResponse.json({ 
        success: false,
        error: 'Task not found'
      }, { status: 404 });
    }

    // Get or create progress
    let progress = await TaskProgress.findOne({
      userId: userEmail,
      projectId: params.projectId
    });

    if (!progress) {
      // Initialize progress with all project tasks
      const initialTasks = [
        ...(projectObj.tasks?.discord?.tasks || []).map((task: ProjectTask) => ({
          taskId: task.id,
          type: 'discord' as const,
          status: 'pending' as const,
          subtasks: task.subtasks?.map(subtask => ({
            subtaskId: subtask.id,
            completed: false
          })) || []
        })),
        ...(projectObj.tasks?.social?.tasks || []).map((task: ProjectTask) => ({
          taskId: task.id,
          type: 'social' as const,
          status: 'pending' as const
        }))
      ];

      try {
        progress = await TaskProgress.create({
          userId: userEmail,
          projectId: params.projectId,
          tasks: initialTasks,
          totalPoints: 0,
          completedTasks: 0
        });
      } catch (error) {
        console.error('Error creating task progress:', error);
        if (error instanceof Error) {
          console.error('Error details:', {
            message: error.message,
            stack: error.stack
          });
        }
        return NextResponse.json({ 
          success: false,
          error: 'Failed to initialize task progress',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // Update task progress
    const now = new Date();
    const taskIndex = progress.tasks.findIndex(t => t.taskId === taskId);

    if (taskIndex === -1) {
      // Add new task
      const newTask = {
        taskId,
        type,
        status: 'pending_approval' as const,
        completedAt: now,
        submission,
        subtasks: projectTask.subtasks?.map(subtask => ({
          subtaskId: subtask.id,
          completed: false
        })) || []
      };
      
      progress.tasks.push(newTask);
      progress.totalPoints += projectTask.points;
      progress.completedTasks += 1;
    } else {
      // Update existing task
      const task = progress.tasks[taskIndex];
      if (task.status === 'pending') {
        task.status = 'pending_approval';
        task.completedAt = now;
        task.submission = submission;
        progress.totalPoints += projectTask.points;
        progress.completedTasks += 1;
      }
    }

    // Save changes
    try {
      await progress.save();
      console.log('Task progress updated successfully');
    } catch (error) {
      console.error('Error saving task progress:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
      }
      return NextResponse.json({ 
        success: false,
        error: 'Failed to save task progress',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

    // Return the raw progress object
    return NextResponse.json({ 
      success: true,
      data: progress.toObject()
    });
  } catch (error) {
    console.error('Error in POST progress:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update task progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Handle OPTIONS for CORS
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
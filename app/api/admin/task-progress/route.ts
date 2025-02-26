import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TaskProgress from '@/src/models/TaskProgress';
import Project, { IProject } from '@/src/models/Project';
import User from '@/src/models/User';
import { Document, Types } from 'mongoose';

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
  subtasks?: {
    subtaskId: string;
    completed: boolean;
    completedAt?: Date;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    // Check for admin access
    const adminAccess = request.cookies.get('adminAccess')?.value;
    if (!adminAccess || adminAccess !== 'true') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify admin email
    const adminEmail = authHeader.split(' ')[1];
    if (adminEmail !== 'admin@darknightlabs.com') {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    await dbConnect();

    // Get all task progress entries
    const taskProgressList = await TaskProgress.find();

    // Get unique project IDs and user IDs using Object.keys and reduce
    const projectIds = Array.from(new Set(
      taskProgressList.reduce((acc, tp) => {
        acc.push(tp.projectId);
        return acc;
      }, [] as string[])
    ));

    const userIds = Array.from(new Set(
      taskProgressList.reduce((acc, tp) => {
        acc.push(tp.userId);
        return acc;
      }, [] as string[])
    ));

    // Fetch all related projects and users
    const [projects, users] = await Promise.all([
      Project.find({ _id: { $in: projectIds } }),
      User.find({ email: { $in: userIds } })
    ]);

    // Create maps for quick lookups
    const projectMap = new Map(
      projects.map((p) => {
        const doc = (p as IProject & { _id: Types.ObjectId }).toObject();
        return [doc._id.toString(), doc];
      })
    );
    const userMap = new Map(users.map(u => [u.email, u]));

    // Transform the data to include project and user details
    const transformedProgress = taskProgressList.flatMap(progress => {
      const project = projectMap.get(progress.projectId);
      if (!project) return [];

      return progress.tasks.map((task: TaskProgressItem) => {
        // Find the task details from the project
        const taskDetails = project.tasks.discord.tasks.find((t: ProjectTask) => t.id === task.taskId) ||
                          project.tasks.social.tasks.find((t: ProjectTask) => t.id === task.taskId);
        if (!taskDetails) return null;

        return {
          taskId: task.taskId,
          projectId: progress.projectId,
          projectName: project.name,
          userId: progress.userId,
          userEmail: progress.userId,
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
          subtasks: taskDetails.subtasks?.map((subtask: ProjectSubtask) => ({
            subtaskId: subtask.id,
            title: subtask.title,
            completed: task.subtasks?.find((s: TaskProgressSubtask) => s.subtaskId === subtask.id)?.completed || false,
            required: subtask.required
          }))
        };
      }).filter(Boolean);
    });

    return NextResponse.json({
      success: true,
      data: transformedProgress
    });
  } catch (error) {
    console.error('Error fetching task progress:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to fetch task progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for admin access
    const adminAccess = request.cookies.get('adminAccess')?.value;
    if (!adminAccess || adminAccess !== 'true') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify admin email
    const adminEmail = authHeader.split(' ')[1];
    if (adminEmail !== 'admin@darknightlabs.com') {
      return NextResponse.json({ error: 'Invalid admin credentials' }, { status: 401 });
    }

    await dbConnect();

    const { taskId, projectId, userId, action } = await request.json();

    if (!taskId || !projectId || !userId || !action) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing required fields: taskId, projectId, userId, action' 
      }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid action. Must be either "approve" or "reject"' 
      }, { status: 400 });
    }

    // Find the task progress
    const progress = await TaskProgress.findOne({
      projectId,
      userId
    });

    if (!progress) {
      return NextResponse.json({ 
        success: false,
        error: 'Task progress not found' 
      }, { status: 404 });
    }

    // Find the specific task
    const taskIndex = progress.tasks.findIndex(t => t.taskId === taskId);
    if (taskIndex === -1) {
      return NextResponse.json({ 
        success: false,
        error: 'Task not found in progress' 
      }, { status: 404 });
    }

    // Update the task status
    progress.tasks[taskIndex].status = action === 'approve' ? 'completed' : 'pending';
    if (action === 'approve') {
      progress.tasks[taskIndex].completedAt = new Date();
    }

    await progress.save();

    return NextResponse.json({
      success: true,
      message: `Task ${action}d successfully`
    });
  } catch (error) {
    console.error('Error updating task progress:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update task progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
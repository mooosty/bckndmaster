import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Task from '@/src/models/Task';
import Project, { IProject } from '@/src/models/Project';
import { Document, Types } from 'mongoose';

export async function GET(req: NextRequest) {
  try {
    // Get user email from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    const userEmail = authHeader.split(' ')[1];

    // Connect to database
    await dbConnect();

    // Fetch all tasks assigned to the user
    const tasks = await Task.find({ 
      userId: userEmail 
    }).sort({ createdAt: -1 });

    // Get all unique project IDs
    const projectIds = Array.from(new Set(tasks.map(task => task.projectId)));

    // Fetch project details for all tasks
    const projects = await Project.find({
      _id: { $in: projectIds }
    });

    // Create a map of project details for quick lookup
    const projectMap = new Map();
    projects.forEach(project => {
      const id = project._id?.toString();
      if (id) projectMap.set(id, project.toObject());
    });

    // Transform tasks with project details
    const transformedTasks = tasks.map(task => {
      const project = projectMap.get(task.projectId);
      return {
        id: task._id,
        projectId: task.projectId,
        projectName: project?.name || 'Unknown Project',
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        priority: task.priority,
        status: task.status,
        submission: task.submission,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      };
    });

    return NextResponse.json({
      success: true,
      data: transformedTasks
    });
  } catch (error) {
    console.error('Error fetching assigned tasks:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch assigned tasks' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  });
} 
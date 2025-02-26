import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/src/models/Project';
import Application from '@/src/models/Application';
import Task from '@/models/Task';

export async function GET(request: NextRequest) {
  try {
    // Get user email from authorization header
    const userEmail = request.headers.get('authorization')?.split(' ')[1];
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch all stats in parallel
    const [
      totalProjects,
      openProjects,
      activeApplications,
      completedTasks
    ] = await Promise.all([
      Project.countDocuments(),
      Project.countDocuments({ status: 'OPEN' }),
      Application.countDocuments({ 
        userId: userEmail,
        status: { $in: ['PENDING', 'APPROVED'] }
      }),
      Task.countDocuments({
        assignedTo: userEmail,
        status: 'COMPLETED'
      })
    ]);

    return NextResponse.json({
      totalProjects,
      openProjects,
      activeApplications,
      completedTasks
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch stats' 
    }, { status: 500 });
  }
} 
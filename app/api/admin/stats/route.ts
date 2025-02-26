import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Project from '@/src/models/Project';
import Task from '@/models/Task';
import Application from '@/src/models/Application';
import User from '@/src/models/User';

export async function GET(request: NextRequest) {
  try {
    // Check for admin access
    const adminAccess = request.cookies.get('adminAccess')?.value;
    if (!adminAccess || adminAccess !== 'true') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await dbConnect();

    // Fetch all stats in parallel
    const [
      totalProjects,
      totalTasks,
      pendingApplications,
      activeUsers
    ] = await Promise.all([
      Project.countDocuments(),
      Task.countDocuments(),
      Application.countDocuments({ status: 'PENDING' }),
      User.countDocuments({ status: 'ACTIVE' })
    ]);

    return NextResponse.json({
      totalProjects,
      totalTasks,
      pendingApplications,
      activeUsers
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch admin stats' 
    }, { status: 500 });
  }
} 
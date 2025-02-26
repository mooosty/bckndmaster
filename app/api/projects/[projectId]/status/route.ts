import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/app/middleware/adminAuth';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';

export async function PUT(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  return adminAuth(async () => {
    try {
      // Connect to database
      await dbConnect();
      
      const { status } = await request.json();

      // Validate status
      const validStatuses = ['COMING_SOON', 'OPEN', 'IN_PROGRESS', 'COMPLETED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        }, { status: 400 });
      }

      // Update project status
      const project = await Project.findByIdAndUpdate(
        params.projectId,
        { status },
        { new: true, runValidators: true }
      );

      if (!project) {
        return NextResponse.json({
          success: false,
          message: 'Project not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Project status updated successfully',
        project
      });
    } catch (error) {
      console.error('Error updating project status:', error);
      return NextResponse.json({
        success: false,
        message: 'Failed to update project status'
      }, { status: 500 });
    }
  })(request);
} 
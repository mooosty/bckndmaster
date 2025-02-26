import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/app/middleware/adminAuth';
import dbConnect from '@/lib/db';
import Application from '@/models/Application';

export const PUT = adminAuth(async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    // Connect to database
    await dbConnect();

    // Get status from request body
    const { status } = await request.json();

    // Validate status
    const validStatuses = ['ACCEPTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      }, { status: 400 });
    }

    // Update application status
    const application = await Application.findByIdAndUpdate(
      params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('projectId', 'title status');

    if (!application) {
      return NextResponse.json({
        success: false,
        message: 'Application not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Application ${status.toLowerCase()} successfully`,
      application
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update application status'
    }, { status: 500 });
  }
}); 
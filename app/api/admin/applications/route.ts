import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import UserCollaboration from '@/src/models/UserCollaboration';
import Project from '@/src/models/Project';

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

    // TODO: Add admin check here
    // For now, we'll assume the endpoint is protected by middleware

    await dbConnect();
    
    // Get all collaboration requests
    const collaborations = await UserCollaboration.find().lean();

    // Get all project IDs from collaborations
    const projectIds = Array.from(new Set(collaborations.map(collab => collab.projectId)));

    // Get project details for all collaborations
    const projects = await Project.find({
      _id: { $in: projectIds }
    }).lean();

    // Transform collaborations with project details
    const transformedCollaborations = collaborations.map(collab => {
      const project = projects.find(p => p._id.toString() === collab.projectId.toString());
      return {
        id: collab._id,
        userId: collab.userId,
        projectId: collab.projectId,
        projectName: project?.name || 'Unknown Project',
        projectImage: project?.coverImage,
        status: collab.status,
        about: collab.about,
        collaboration: collab.collaboration,
        submittedAt: collab.createdAt,
        updatedAt: collab.updatedAt
      };
    });

    return NextResponse.json({ 
      success: true,
      data: transformedCollaborations
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch applications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
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

    // TODO: Add admin check here
    // For now, we'll assume the endpoint is protected by middleware

    const body = await request.json();
    const { id, action } = body;

    if (!id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid request. Required fields: id, action (approve/reject)',
        receivedData: body
      }, { status: 400 });
    }

    await dbConnect();

    const collaboration = await UserCollaboration.findById(id);
    if (!collaboration) {
      return NextResponse.json({ 
        error: 'Collaboration request not found',
        requestedId: id
      }, { status: 404 });
    }

    // Update the status based on the action
    collaboration.status = action === 'approve' ? 'approved' : 'rejected';
    await collaboration.save();

    // Get project details for the response
    const project = await Project.findById(collaboration.projectId).lean();

    return NextResponse.json({ 
      success: true,
      message: `Collaboration request ${action}d successfully`,
      data: {
        id: collaboration._id,
        userId: collaboration.userId,
        projectId: collaboration.projectId,
        projectName: project?.name || 'Unknown Project',
        projectImage: project?.coverImage,
        status: collaboration.status,
        about: collaboration.about,
        collaboration: collaboration.collaboration,
        submittedAt: collaboration.createdAt,
        updatedAt: collaboration.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating application:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update application',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
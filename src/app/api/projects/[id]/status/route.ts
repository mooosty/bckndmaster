import { NextRequest, NextResponse } from 'next/server';
import projectController from '../../../../../controllers/projectController';
import { adminAuth } from '../../../../../middleware/adminAuth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate admin
    const authResult = await adminAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    return projectController.updateStatus(params.id, request);
  } catch (error) {
    console.error('Error in PUT /api/projects/[id]/status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
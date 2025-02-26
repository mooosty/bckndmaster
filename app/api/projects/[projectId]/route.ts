import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';


export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  // Log headers for debugging
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  
  // Check for authorization header
  const authHeader = request.headers.get('authorization');
  console.log('Auth Header:', authHeader);
  
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ 
      error: 'Authentication required',
      received_header: authHeader
    }, { status: 401 });
  }

  // Get email from Bearer token
  const userEmail = authHeader.split(' ')[1];
  if (!userEmail || !userEmail.includes('@')) {
    return NextResponse.json({ 
      error: 'Invalid authentication token',
      received_email: userEmail
    }, { status: 401 });
  }

  try {
    await dbConnect();
    
    const project = await Project.findById(params.projectId);
    
    if (!project) {
      return NextResponse.json({ 
        error: 'Project not found'
      }, { status: 404 });
    }

    // Transform project to match the schema
    const plainProject = project.toObject();

    return NextResponse.json({
      success: true,
      data: plainProject
    });
  } catch (error) {
    console.error('Error in GET /api/projects/[projectId]:', error);
    return NextResponse.json({ 
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Origin': '*'
    },
  });
} 
import { NextRequest, NextResponse } from 'next/server';
import { userAuth } from '@/src/middleware/userAuth';
import dbConnect from '@/lib/db';
import Project from '@/models/Project';
import Application from '@/src/models/Application';

export async function POST(
  request: NextRequest,
  context: { params: { projectId: string } }
) {
  try {
    // Authenticate user
    const authResult = await userAuth(request);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    await dbConnect();
    const userEmail = authResult.user.email;

    // Check if project exists and is open for applications
    const project = await Project.findById(context.params.projectId);
    if (!project) {
      return NextResponse.json({
        success: false,
        message: 'Project not found'
      }, { status: 404 });
    }

    if (project.status !== 'OPEN') {
      return NextResponse.json({
        success: false,
        message: 'Project is not open for applications'
      }, { status: 400 });
    }

    // Get application data from request body
    const { answers } = await request.json();
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Answers are required'
      }, { status: 400 });
    }

    // Check if user already has a pending application for this project
    const existingApplication = await Application.findOne({
      projectId: context.params.projectId,
      userId: userEmail,
      status: 'PENDING'
    });

    if (existingApplication) {
      return NextResponse.json({
        success: false,
        message: 'You already have a pending application for this project'
      }, { status: 400 });
    }

    // Create application
    const application = await Application.create({
      projectId: context.params.projectId,
      userId: userEmail,
      answers
    });

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to submit application'
    }, { status: 500 });
  }
} 
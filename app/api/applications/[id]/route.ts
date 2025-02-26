import { NextRequest, NextResponse } from 'next/server';
import { userAuth, isAdmin } from '@/middleware/userAuth';
import dbConnect from '@/lib/db';
import Application from '@/src/models/Application';
import mongoose from 'mongoose';

interface AuthResult {
  user: {
    email: string;
    role: string;
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const authResult = await userAuth(request);
    if (!('user' in authResult)) {
      return authResult as NextResponse;
    }

    const { user } = authResult as AuthResult;

    // Only admin can update application status
    if (!isAdmin(user)) {
      return NextResponse.json({
        success: false,
        error: 'Admin access required'
      }, { status: 403 });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid application ID'
      }, { status: 400 });
    }

    // Get request body
    const data = await request.json();

    // Validate status
    if (!data.status || !['PENDING', 'APPROVED', 'REJECTED'].includes(data.status)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid status value'
      }, { status: 400 });
    }

    // Connect to database
    await dbConnect();

    // Find and update application
    const application = await Application.findByIdAndUpdate(
      params.id,
      { 
        status: data.status,
        updatedAt: new Date()
      },
      { new: true }
    ).populate('projectId', 'title status');

    if (!application) {
      return NextResponse.json({
        success: false,
        error: 'Application not found'
      }, { status: 404 });
    }

    // Transform application for response
    const plainApp = application.toObject();
    const transformedApplication = {
      id: plainApp._id.toString(),
      userId: plainApp.userId,
      projectId: plainApp.projectId._id.toString(),
      projectTitle: plainApp.projectId.title,
      answers: plainApp.answers,
      status: plainApp.status,
      createdAt: plainApp.createdAt,
      updatedAt: plainApp.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: transformedApplication
    });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update application'
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const authResult = await userAuth(request);
    if (!('user' in authResult)) {
      return authResult as NextResponse;
    }

    const { user } = authResult as AuthResult;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid application ID'
      }, { status: 400 });
    }

    // Connect to database
    await dbConnect();

    // Find application
    const application = await Application.findById(params.id)
      .populate('projectId', 'title status');

    if (!application) {
      return NextResponse.json({
        success: false,
        error: 'Application not found'
      }, { status: 404 });
    }

    // Check access rights
    if (!isAdmin(user) && application.userId !== user.email) {
      return NextResponse.json({
        success: false,
        error: 'Access denied'
      }, { status: 403 });
    }

    // Transform application for response
    const plainApp = application.toObject();
    const transformedApplication = {
      id: plainApp._id.toString(),
      userId: plainApp.userId,
      projectId: plainApp.projectId._id.toString(),
      projectTitle: plainApp.projectId.title,
      answers: plainApp.answers,
      status: plainApp.status,
      createdAt: plainApp.createdAt,
      updatedAt: plainApp.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: transformedApplication
    });
  } catch (error) {
    console.error('Error getting application:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get application'
    }, { status: 500 });
  }
} 
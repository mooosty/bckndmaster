import { NextRequest, NextResponse } from 'next/server';
import { userAuth } from '../../../../../../../middleware/userAuth';
import dbConnect from '@/lib/db';
import Task from '@/models/Task';

export async function POST(
  request: NextRequest,
  context: { params: { projectId: string; taskId: string } }
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
    const { link, description } = await request.json();
    const { projectId, taskId } = context.params;

    if (!link || !description) {
      return NextResponse.json({
        success: false,
        message: 'Link and description are required'
      }, { status: 400 });
    }

    const task = await Task.findOne({
      _id: taskId,
      projectId,
      userId: userEmail
    });

    if (!task) {
      return NextResponse.json({
        success: false,
        message: 'Task not found or you do not have permission to submit'
      }, { status: 404 });
    }

    const submittableStates = ['PENDING', 'IN_PROGRESS', 'NEGOTIATION'];
    if (!submittableStates.includes(task.status)) {
      return NextResponse.json({
        success: false,
        message: `Cannot submit task in ${task.status} status`
      }, { status: 400 });
    }

    task.submission = { link, description };
    task.status = 'SUBMITTED';
    await task.save();

    return NextResponse.json({
      success: true,
      message: 'Task submitted successfully',
      task
    });
  } catch (error) {
    console.error('Error submitting task:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to submit task'
    }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';

export const apiResponse = {
  success: (data: any, message: string = 'Success') => {
    return NextResponse.json({
      success: true,
      message,
      data
    });
  },

  error: (message: string, status: number = 400) => {
    return NextResponse.json({
      success: false,
      message
    }, { status });
  },

  serverError: (error: any) => {
    console.error('Server Error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal Server Error'
    }, { status: 500 });
  }
}; 
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Admin login attempt...');
    const body = await request.json();
    console.log('Request body:', { ...body, adminCode: '[REDACTED]' });

    if (!body.adminCode) {
      return NextResponse.json(
        { error: 'Admin code is required' },
        { status: 400 }
      );
    }

    // Check admin code
    if (body.adminCode !== process.env.ADMIN_ACCESS_CODE) {
      console.log('Invalid admin code provided');
      return NextResponse.json(
        { error: 'Invalid admin code' },
        { status: 401 }
      );
    }

    console.log('Admin code verified, setting cookie');
    
    // Get the domain from the request
    const domain = request.headers.get('host')?.split(':')[0] || '';
    console.log('Setting cookie for domain:', domain);

    // Create the response
    const response = NextResponse.json({ 
      success: true,
      message: 'Login successful'
    });
    
    // Set the cookie with proper production settings
    response.cookies.set('adminAccess', 'true', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
      domain: domain.includes('localhost') ? undefined : domain
    });
    
    // Log the response headers for debugging
    console.log('Response headers:', response.headers.get('set-cookie'));

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
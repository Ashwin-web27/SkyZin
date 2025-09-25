import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    // Validate input
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      );
    }

    // Forward request to the backend API
    const backendResponse = await fetch('http://localhost:5000/api/auth/verify-reset-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });

    const data = await backendResponse.json();

    // Return the backend response
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Verify reset token API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp, password } = body;

    // Validate input
    if (!email || !otp || !password) {
      return NextResponse.json(
        { success: false, message: 'Email, OTP, and password are required' },
        { status: 400 }
      );
    }

    // Forward request to the backend API
    const backendResponse = await fetch('http://localhost:5000/api/auth/reset-password-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, otp, password }),
    });

    const data = await backendResponse.json();

    // Return the backend response
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('Reset password with OTP API error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
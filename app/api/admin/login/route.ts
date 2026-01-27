import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Mock authentication
    if (username === 'admin' && password === '1234') {
      const token = uuidv4();
      const tokenExpiry = new Date();
      tokenExpiry.setDate(tokenExpiry.getDate() + 7);

      return NextResponse.json({
        success: true,
        data: {
          adminUser: {
            id: 'admin-mock',
            username: 'admin',
            displayName: 'Admin (Mock)',
            permissions: 'all'
          },
          token,
          expiresAt: tokenExpiry.toISOString()
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid credentials'
    }, { status: 401 });

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Login error'
    }, { status: 500 });
  }
}
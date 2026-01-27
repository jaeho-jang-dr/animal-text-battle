import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      adminUser: {
        id: 'admin-mock',
        username: 'admin',
        displayName: 'Admin (Mock)',
        permissions: 'all'
      }
    }
  });
}
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      logs: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
    }
  });
}
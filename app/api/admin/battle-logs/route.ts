import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    data: {
      logs: [],
      pagination: {
        page: 1,
        limit: 50,
        total: 0,
        totalPages: 0
      },
      problemUsers: [],
      oldGuestUsers: { count: 0 },
      filters: {}
    }
  });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Stubbed DELETE'
  });
}
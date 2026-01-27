import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ success: true, data: {} });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ success: true });
}
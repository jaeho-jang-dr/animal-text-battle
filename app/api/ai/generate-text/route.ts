import { NextRequest, NextResponse } from 'next/server';

// AI 텍스트 생성 기능 비활성화 - 수동 입력으로 전환
export async function POST(request: NextRequest) {
    return NextResponse.json({
        success: false,
        error: '자동 생성 기능이 비활성화되었습니다. 직접 멋진 대사를 작성해주세요!',
        message: '나만의 창의적인 배틀 대사를 직접 써보세요!'
    }, { status: 400 });
}

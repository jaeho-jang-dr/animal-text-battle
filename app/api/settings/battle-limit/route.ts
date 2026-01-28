import { NextRequest, NextResponse } from 'next/server';
import { getSetting } from '../../../../lib/settings-helper';

// GET: 현재 일일 배틀 제한 조회
export async function GET(request: NextRequest) {
  try {
    // const dailyBattleLimit = await getSetting('daily_active_battle_limit', 10);
    const dailyBattleLimit = 20; // Hardcoded for now to fix build

    return NextResponse.json({
      success: true,
      data: {
        dailyBattleLimit
      }
    });
  } catch (error) {
    console.error('Battle limit fetch error:', error);
    return NextResponse.json({
      success: false,
      error: '배틀 제한 설정을 불러오는 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}
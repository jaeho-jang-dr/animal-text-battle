import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '../../../../lib/firebase-admin';

// 관리자 이메일 목록
const ADMIN_EMAILS = ['drjang000@gmail.com', 'drjang00@gmail.com', '102030hohoho@gmail.com'];

// 토큰에서 사용자 정보 추출
async function verifyAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!decodedToken.email || !ADMIN_EMAILS.includes(decodedToken.email)) {
      return null;
    }

    return decodedToken;
  } catch (error) {
    console.error('Admin verification failed:', error);
    return null;
  }
}

// GET: 배틀 로그 조회
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const searchTerm = searchParams.get('search');

    // Firestore에서 배틀 조회
    let query = adminDb.collection('battles').orderBy('createdAt', 'desc');

    // 날짜 필터
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      query = query.where('createdAt', '>=', fromDate);
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      query = query.where('createdAt', '<=', toDate);
    }

    // 페이지네이션
    const offset = (page - 1) * limit;

    // 전체 개수 조회 (별도 쿼리)
    const countSnap = await adminDb.collection('battles').count().get();
    const total = countSnap.data().count;

    // 배틀 데이터 조회
    const battlesSnap = await query.limit(limit).offset(offset).get();

    const battles = battlesSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        attackerId: data.attackerId,
        defenderId: data.defenderId,
        winnerId: data.winnerId,
        attackerName: data.attacker?.characterName || data.attackerName || '알 수 없음',
        defenderName: data.defender?.characterName || data.defenderName || '알 수 없음',
        attackerEmoji: data.attacker?.animal?.emoji || data.attackerEmoji || '🐾',
        defenderEmoji: data.defender?.animal?.emoji || data.defenderEmoji || '🐾',
        attackerBattleText: data.attackerBattleText || data.attacker?.battleText || '',
        defenderBattleText: data.defenderBattleText || data.defender?.battleText || '',
        aiJudgment: data.aiJudgment || '',
        aiReasoning: data.aiReasoning || '',
        attackerScoreChange: data.attackerScoreChange || 0,
        defenderScoreChange: data.defenderScoreChange || 0,
        createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
      };
    });

    // 오늘 배틀 통계
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayBattlesSnap = await adminDb
      .collection('battles')
      .where('createdAt', '>=', today)
      .count()
      .get();

    const todayBattles = todayBattlesSnap.data().count;

    return NextResponse.json({
      success: true,
      data: {
        logs: battles,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats: {
          todayBattles,
          totalBattles: total,
        },
      },
    });
  } catch (error) {
    console.error('Battle logs fetch error:', error);
    return NextResponse.json({ success: false, error: '배틀 로그 조회 실패' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다' }, { status: 401 });
    }

    // 배틀 삭제는 위험하므로 현재는 지원하지 않음
    return NextResponse.json({ success: false, error: '배틀 삭제는 지원하지 않습니다' }, { status: 400 });
  } catch (error) {
    console.error('Battle delete error:', error);
    return NextResponse.json({ success: false, error: '배틀 삭제 실패' }, { status: 500 });
  }
}

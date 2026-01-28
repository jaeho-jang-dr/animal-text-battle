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

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const logType = searchParams.get('type') || 'all'; // all, admin, warning, battle, user
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // 관리자 활동 로그 조회
    let logsQuery = adminDb.collection('admin_logs').orderBy('created_at', 'desc');

    if (dateFrom) {
      logsQuery = logsQuery.where('created_at', '>=', new Date(dateFrom));
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      logsQuery = logsQuery.where('created_at', '<=', toDate);
    }

    const logsSnap = await logsQuery.limit(limit).offset((page - 1) * limit).get();

    const logs = logsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        action: data.action,
        admin_email: data.admin_email,
        target_user_id: data.target_user_id,
        details: data.details || data.reason || '',
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    // 경고 로그 조회
    const warningsSnap = await adminDb
      .collection('warnings')
      .orderBy('created_at', 'desc')
      .limit(20)
      .get();

    const warningLogs = await Promise.all(
      warningsSnap.docs.map(async (doc) => {
        const data = doc.data();

        // 사용자 이름 조회
        let userName = '알 수 없음';
        if (data.user_id) {
          const userDoc = await adminDb.collection('users').doc(data.user_id).get();
          if (userDoc.exists) {
            userName = userDoc.data()?.display_name || '알 수 없음';
          }
        }

        return {
          id: doc.id,
          type: 'warning',
          action: `경고: ${data.warning_type || 'manual'}`,
          user_name: userName,
          user_id: data.user_id,
          content: data.content || data.reason || '',
          issued_by: data.issued_by || '시스템',
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      })
    );

    // 최근 배틀 로그 (간략)
    const battlesSnap = await adminDb.collection('battles').orderBy('createdAt', 'desc').limit(20).get();

    const battleLogs = battlesSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'battle',
        attacker: data.attacker?.characterName || '알 수 없음',
        defender: data.defender?.characterName || '알 수 없음',
        winner: data.winnerId === data.attackerId ? 'attacker' : 'defender',
        created_at: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    // 최근 가입 사용자
    const recentUsersSnap = await adminDb
      .collection('users')
      .orderBy('created_at', 'desc')
      .limit(10)
      .get();

    const recentUsers = recentUsersSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        type: 'user_joined',
        display_name: data.display_name || `User_${doc.id.slice(0, 5)}`,
        email: data.email || '',
        is_guest: data.is_guest || false,
        created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    });

    // 통계
    const totalAdminLogs = (await adminDb.collection('admin_logs').count().get()).data().count;
    const totalWarnings = (await adminDb.collection('warnings').count().get()).data().count;

    // 오늘 통계
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayWarningsSnap = await adminDb
      .collection('warnings')
      .where('created_at', '>=', today)
      .count()
      .get();

    const todayBattlesSnap = await adminDb.collection('battles').where('createdAt', '>=', today).count().get();

    return NextResponse.json({
      success: true,
      data: {
        logs,
        warningLogs,
        battleLogs,
        recentUsers,
        pagination: {
          page,
          limit,
          total: totalAdminLogs,
          totalPages: Math.ceil(totalAdminLogs / limit),
        },
        stats: {
          totalAdminLogs,
          totalWarnings,
          todayWarnings: todayWarningsSnap.data().count,
          todayBattles: todayBattlesSnap.data().count,
        },
      },
    });
  } catch (error) {
    console.error('Logs fetch error:', error);
    return NextResponse.json({ success: false, error: '로그 조회 실패' }, { status: 500 });
  }
}

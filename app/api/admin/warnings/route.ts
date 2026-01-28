import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '../../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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

// GET: 경고 내역 조회
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Firestore에서 경고 조회
    let warningsQuery = adminDb.collection('warnings').orderBy('created_at', 'desc').limit(limit);

    if (userId) {
      warningsQuery = adminDb
        .collection('warnings')
        .where('user_id', '==', userId)
        .orderBy('created_at', 'desc')
        .limit(limit);
    }

    const warningsSnap = await warningsQuery.get();

    const warnings = await Promise.all(
      warningsSnap.docs.map(async (doc) => {
        const data = doc.data();

        // 사용자 정보 조회
        let userName = '알 수 없음';
        let userEmail = '';
        let isGuest = false;

        if (data.user_id) {
          const userDoc = await adminDb.collection('users').doc(data.user_id).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            userName = userData?.display_name || '알 수 없음';
            userEmail = userData?.email || '';
            isGuest = userData?.is_guest || false;
          }
        }

        // 캐릭터 정보 조회
        let characterName = '';
        if (data.character_id) {
          const charDoc = await adminDb.collection('characters').doc(data.character_id).get();
          if (charDoc.exists) {
            characterName = charDoc.data()?.characterName || '';
          }
        }

        return {
          id: doc.id,
          user_id: data.user_id,
          warning_type: data.warning_type || 'manual_warning',
          content: data.content || data.reason || '',
          created_at: data.created_at?.toDate?.()?.toISOString() || new Date().toISOString(),
          display_name: userName,
          email: userEmail,
          is_guest: isGuest,
          character_name: characterName,
        };
      })
    );

    // 경고 유형별 통계
    const allWarningsSnap = await adminDb.collection('warnings').get();
    const statsMap: { [key: string]: number } = {};

    allWarningsSnap.docs.forEach((doc) => {
      const type = doc.data().warning_type || 'other';
      statsMap[type] = (statsMap[type] || 0) + 1;
    });

    const stats = Object.entries(statsMap).map(([warning_type, count]) => ({
      warning_type,
      count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        warnings,
        stats,
      },
    });
  } catch (error) {
    console.error('Warnings fetch error:', error);
    return NextResponse.json({ success: false, error: '경고 내역 조회 실패' }, { status: 500 });
  }
}

// POST: 사용자에게 경고 발송
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다' }, { status: 401 });
    }

    const { userId, reason, warningType, characterId } = await request.json();

    if (!userId || !reason) {
      return NextResponse.json({ success: false, error: '필수 항목이 누락되었습니다' }, { status: 400 });
    }

    // 사용자 존재 확인
    const userRef = adminDb.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: '사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    const userData = userDoc.data();
    const currentWarningCount = userData?.warning_count || 0;
    const newWarningCount = currentWarningCount + 1;

    // 1. 경고 기록 추가
    const warningRef = await adminDb.collection('warnings').add({
      user_id: userId,
      character_id: characterId || null,
      warning_type: warningType || 'manual_warning',
      content: reason,
      reason: reason,
      created_at: FieldValue.serverTimestamp(),
      issued_by: admin.email,
    });

    // 2. 사용자 경고 카운트 증가
    const updateData: any = {
      warning_count: newWarningCount,
      last_warning_at: FieldValue.serverTimestamp(),
    };

    // 3. 삼진아웃 처리 (경고 3회 이상시 자동 정지)
    let autoSuspended = false;
    if (newWarningCount >= 3 && !userData?.is_suspended) {
      updateData.is_suspended = true;
      updateData.suspended_at = FieldValue.serverTimestamp();
      updateData.suspension_reason = '경고 누적(3회)에 의한 자동 정지';
      autoSuspended = true;
    }

    await userRef.update(updateData);

    // 활동 로그 기록
    await adminDb.collection('admin_logs').add({
      action: 'warning_issued',
      target_user_id: userId,
      warning_id: warningRef.id,
      reason: reason,
      warning_type: warningType || 'manual_warning',
      auto_suspended: autoSuspended,
      admin_email: admin.email,
      created_at: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        message: autoSuspended ? '경고가 발송되었고 사용자가 자동 정지되었습니다' : '경고가 발송되었습니다',
        warningCount: newWarningCount,
        isSuspended: userData?.is_suspended || autoSuspended,
        autoSuspended,
      },
    });
  } catch (error) {
    console.error('Warning creation error:', error);
    return NextResponse.json({ success: false, error: '경고 발송 실패' }, { status: 500 });
  }
}

// DELETE: 경고 삭제 또는 정지 해제
export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다' }, { status: 401 });
    }

    const { action, userId, warningId } = await request.json();

    if (action === 'unsuspend' && userId) {
      // 정지 해제
      const userRef = adminDb.collection('users').doc(userId);
      await userRef.update({
        is_suspended: false,
        suspended_at: null,
        suspension_reason: null,
        unsuspended_at: FieldValue.serverTimestamp(),
        unsuspended_by: admin.email,
      });

      // 로그 기록
      await adminDb.collection('admin_logs').add({
        action: 'user_unsuspended',
        target_user_id: userId,
        admin_email: admin.email,
        created_at: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ success: true, message: '사용자 정지가 해제되었습니다' });
    }

    if (action === 'delete_warning' && warningId) {
      // 경고 삭제
      await adminDb.collection('warnings').doc(warningId).delete();

      return NextResponse.json({ success: true, message: '경고가 삭제되었습니다' });
    }

    return NextResponse.json({ success: false, error: '유효하지 않은 요청입니다' }, { status: 400 });
  } catch (error) {
    console.error('Warning delete error:', error);
    return NextResponse.json({ success: false, error: '처리 실패' }, { status: 500 });
  }
}

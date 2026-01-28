import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '../../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// 기본 설정값
const DEFAULT_SETTINGS = {
  daily_battle_limit: 10,
  profanity_filter_enabled: true,
  auto_lock_on_violation: true,
  max_warnings_before_lock: 3,
  maintenance_mode: false,
  maintenance_message: '시스템 점검 중입니다. 잠시 후 다시 시도해주세요.',
  bot_battle_enabled: true,
  max_characters_per_user: 3,
};

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

    // 관리자 이메일 확인
    if (!decodedToken.email || !ADMIN_EMAILS.includes(decodedToken.email)) {
      return null;
    }

    return decodedToken;
  } catch (error) {
    console.error('Admin verification failed:', error);
    return null;
  }
}

// GET: 설정 조회
export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다' }, { status: 401 });
    }

    const settingsRef = adminDb.collection('settings').doc('global');
    const settingsDoc = await settingsRef.get();

    if (!settingsDoc.exists) {
      // 설정이 없으면 기본값으로 생성
      await settingsRef.set({
        ...DEFAULT_SETTINGS,
        created_at: FieldValue.serverTimestamp(),
        updated_at: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({
        success: true,
        data: {
          settings: Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
            id: key,
            setting_key: key,
            setting_value: String(value),
          })),
        },
      });
    }

    const data = settingsDoc.data();

    // 설정을 배열 형태로 변환 (기존 UI 호환)
    const settings = Object.entries({ ...DEFAULT_SETTINGS, ...data })
      .filter(([key]) => !['created_at', 'updated_at', 'updated_by'].includes(key))
      .map(([key, value]) => ({
        id: key,
        setting_key: key,
        setting_value: String(value),
      }));

    return NextResponse.json({ success: true, data: { settings } });
  } catch (error) {
    console.error('Settings fetch error:', error);
    return NextResponse.json({ success: false, error: '설정 조회 실패' }, { status: 500 });
  }
}

// PUT: 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key) {
      return NextResponse.json({ success: false, error: '설정 키가 필요합니다' }, { status: 400 });
    }

    // 값 타입 변환
    let parsedValue: string | number | boolean = value;
    if (value === 'true') parsedValue = true;
    else if (value === 'false') parsedValue = false;
    else if (!isNaN(Number(value)) && value !== '') parsedValue = Number(value);

    const settingsRef = adminDb.collection('settings').doc('global');

    await settingsRef.set(
      {
        [key]: parsedValue,
        updated_at: FieldValue.serverTimestamp(),
        updated_by: admin.email,
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, message: '설정이 저장되었습니다' });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ success: false, error: '설정 업데이트 실패' }, { status: 500 });
  }
}

// POST: 여러 설정 일괄 업데이트
export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    const { settings } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ success: false, error: '설정 데이터가 필요합니다' }, { status: 400 });
    }

    const settingsRef = adminDb.collection('settings').doc('global');

    await settingsRef.set(
      {
        ...settings,
        updated_at: FieldValue.serverTimestamp(),
        updated_by: admin.email,
      },
      { merge: true }
    );

    return NextResponse.json({ success: true, message: '설정이 저장되었습니다' });
  } catch (error) {
    console.error('Settings batch update error:', error);
    return NextResponse.json({ success: false, error: '설정 일괄 업데이트 실패' }, { status: 500 });
  }
}

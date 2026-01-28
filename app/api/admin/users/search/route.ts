import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '../../../../../lib/firebase-admin';

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
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const filter = searchParams.get('filter') || 'all'; // all, suspended, warned, guest

    // Firestore에서 사용자 조회
    let usersRef = adminDb.collection('users');
    let usersQuery = usersRef.orderBy('created_at', 'desc').limit(limit);

    const usersSnap = await usersQuery.get();

    const users = [];

    for (const doc of usersSnap.docs) {
      const userData = doc.data();

      // 필터 적용
      if (filter === 'suspended' && !userData.is_suspended) continue;
      if (filter === 'warned' && (userData.warning_count || 0) === 0) continue;
      if (filter === 'guest' && !userData.is_guest) continue;

      // 검색어 필터
      if (query) {
        const searchLower = query.toLowerCase();
        const matchEmail = userData.email?.toLowerCase().includes(searchLower);
        const matchName = userData.display_name?.toLowerCase().includes(searchLower);
        const matchId = doc.id.toLowerCase().includes(searchLower);

        if (!matchEmail && !matchName && !matchId) continue;
      }

      // 캐릭터 정보 조회
      const charactersSnap = await adminDb
        .collection('characters')
        .where('userId', '==', doc.id)
        .get();

      let highestScore = 0;
      charactersSnap.docs.forEach((charDoc) => {
        const charData = charDoc.data();
        if (charData.score > highestScore) {
          highestScore = charData.score;
        }
      });

      users.push({
        id: doc.id,
        email: userData.email || '',
        display_name: userData.display_name || `User_${doc.id.slice(0, 5)}`,
        is_guest: userData.is_guest ? 1 : 0,
        is_suspended: userData.is_suspended ? 1 : 0,
        warning_count: userData.warning_count || 0,
        created_at: userData.created_at?.toDate?.()?.toISOString() || userData.created_at || '',
        character_count: charactersSnap.size,
        highest_score: highestScore,
        last_login: userData.last_login?.toDate?.()?.toISOString() || '',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        users,
        total: users.length,
      },
    });
  } catch (error) {
    console.error('Users search error:', error);
    return NextResponse.json({ success: false, error: '사용자 검색 실패' }, { status: 500 });
  }
}

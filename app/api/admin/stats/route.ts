import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';

// 관리자 토큰 검증 함수
function verifyAdminToken(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  // 간단한 토큰 검증 (실제로는 더 복잡한 검증 필요)
  return token && token.length > 0;
}

export async function GET(request: NextRequest) {
  try {
    // 관리자 권한 검증
    if (!verifyAdminToken(request)) {
      return NextResponse.json({
        success: false,
        error: '관리자 권한이 필요합니다'
      }, { status: 401 });
    }

    // 1. Basic Counts (Parallel)
    const [
      usersSnap,
      charsSnap,
      battlesSnap,
      activeCharsSnap,
      suspendedSnap
    ] = await Promise.all([
      adminDb.collection('users').count().get(),
      adminDb.collection('characters').count().get(),
      adminDb.collection('battles').count().get(),
      adminDb.collection('characters').where('isActive', '==', true).count().get(),
      adminDb.collection('users').where('isSuspended', '==', true).count().get()
    ]);

    const totalUsers = usersSnap.data().count;
    const totalCharacters = charsSnap.data().count;
    const totalBattles = battlesSnap.data().count;
    const activeCharacters = activeCharsSnap.data().count; // Approx active users
    const suspendedUsers = suspendedSnap.data().count;

    // 2. Fetch Top Characters (Reuse Leaderboard Logic basically)
    const topCharsSnap = await adminDb.collection('characters')
      .orderBy('baseScore', 'desc')
      .limit(10)
      .get();

    // Enrich Top Chars
    const topCharacters = await Promise.all(topCharsSnap.docs.map(async doc => {
      const d = doc.data();
      let ownerName = 'Unknown';
      let ownerEmail = '';
      if (d.userId) {
        const uSnap = await adminDb.collection('users').doc(d.userId).get();
        if (uSnap.exists) {
          ownerName = uSnap.data()?.displayName || 'Unknown';
          ownerEmail = uSnap.data()?.email || '';
        }
      }
      return {
        id: doc.id,
        character_name: d.characterName,
        base_score: d.baseScore,
        elo_score: d.eloScore,
        wins: d.wins,
        losses: d.losses,
        total_battles: (d.totalActiveBattles || 0) + (d.totalPassiveBattles || 0),
        animal_name: d.animal?.name,
        korean_name: d.animal?.korean_name,
        emoji: d.animal?.emoji,
        owner_name: ownerName,
        owner_email: ownerEmail
      };
    }));

    // 3. Recent Battles
    const battlesQuery = await adminDb.collection('battles')
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const recentBattles = await Promise.all(battlesQuery.docs.map(async doc => {
      const b = doc.data();
      // Need names.
      const [acSnap, dcSnap] = await Promise.all([
        adminDb.collection('characters').doc(b.attackerId).get(),
        adminDb.collection('characters').doc(b.defenderId).get()
      ]);
      const ac = acSnap.data();
      const dc = dcSnap.data();

      // Owner names need more fetches... let's skip owner display name for performance or fetch if critical.
      // Admin might want it.
      let attackerOwner = 'Unknown';
      let defenderOwner = 'Unknown';
      if (ac?.userId) {
        const u = await adminDb.collection('users').doc(ac.userId).get();
        attackerOwner = u.data()?.displayName || 'Unknown';
      }
      if (dc?.userId) {
        const u = await adminDb.collection('users').doc(dc.userId).get();
        defenderOwner = u.data()?.displayName || 'Unknown';
      }

      return {
        id: doc.id,
        created_at: b.createdAt?.toDate ? b.createdAt.toDate().toISOString() : new Date().toISOString(),
        winner_id: b.winnerId,
        attacker_id: b.attackerId, // Needed for comparison
        attacker_name: ac?.characterName || 'Unknown',
        defender_name: dc?.characterName || 'Unknown',
        winner_name: b.winnerId === b.attackerId ? (ac?.characterName || 'Unknown') : (dc?.characterName || 'Unknown'),
        attacker_score_change: b.attackerScoreChange,
        defender_score_change: b.defenderScoreChange,
        attacker_emoji: ac?.animal?.emoji || '❓',
        defender_emoji: dc?.animal?.emoji || '❓',
        attacker_owner: attackerOwner,
        defender_owner: defenderOwner
      };
    }));

    // 4. Online Users (Recent Login)
    // Firestore needs composite index for orderBy time + where.
    // Let's just fetch latest updated users.
    const onlineUsersSnap = await adminDb.collection('users')
      .orderBy('last_login', 'desc') // Ensure field name matches AuthContext (last_login)
      .limit(10) // Small limit
      .get();

    // Filter in memory for 5 minutes for 'online' status visually
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const onlineUsers = onlineUsersSnap.docs
      .map(d => ({ ...d.data(), id: d.id }))
      .filter((u: any) => {
        const loginTime = u.last_login?.toDate ? u.last_login.toDate().getTime() : 0;
        return loginTime > fiveMinutesAgo;
      })
      .map((u: any) => ({
        id: u.id,
        email: u.email,
        display_name: u.display_name,
        last_login: u.last_login?.toDate().toISOString(),
        character_count: 0 // Fetching count for each is expensive, skip or approx
      }));


    // 5. Complex/TimeSeries Stats - Returning placeholders to avoid massive reads/costs
    // These would typically require a dedicated stats collection updated via Cloud Functions triggers.

    return NextResponse.json({
      success: true,
      data: {
        totalUsers,
        guestUsers: 0, // Need filtering, skipped for speed
        registeredUsers: totalUsers, // Approx
        activeUsers: activeCharacters, // Proxy
        suspendedUsers,
        onlineUsersCount: onlineUsers.length,

        totalCharacters,
        botCharacters: 0, // Need filter

        totalBattles,
        todayBattles: 0, // Time filter query needed
        weekBattles: 0,

        averageElo: 1000,

        topCharacters,
        recentBattles,
        warningUsers: [], // Warnings collection?
        animalStats: [], // Too heavy to aggregate on fly
        hourlyBattles: [],
        dailyNewUsers: [],
        onlineUsers
      }
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({
      success: false,
      error: '통계 조회 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}
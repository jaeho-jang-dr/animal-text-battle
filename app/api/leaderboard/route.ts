import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';

// GET: 리더보드 조회 (TOP 25)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'base'; // 'elo', 'base', 'wins', 'totalBattles'
    
    const category = searchParams.get('category'); // 동물 카테고리 필터

    // Firestore Query
    let query = adminDb.collection('characters')
      .where('isActive', '==', true);
    // .orderBy(orderField, 'desc') // Removed to avoid index error
    // .limit(50); // Removed to allow full in-memory sorting for now

    const snapshot = await query.get();

    if (snapshot.empty) {
      return NextResponse.json({
        success: true,
        data: { leaderboard: [], stats: { totalCharacters: 0, averageElo: 0 }, lastUpdated: new Date().toISOString() }
      });
    }

    const charactersRaw = snapshot.docs.map(doc => doc.data());

    // Collect User IDs to fetch profiles
    const userIds = [...new Set(charactersRaw.map(c => c.userId))];
    const userDocsPromises = userIds.map(uid => adminDb.collection('users').doc(uid).get());
    const userDocsSnap = await Promise.all(userDocsPromises);

    // Map UserId -> UserData
    const userMap: Record<string, any> = {};
    userDocsSnap.forEach(doc => {
      if (doc.exists) {
        userMap[doc.id] = doc.data();
      }
    });

    // Merge and Filter
    let characters = charactersRaw.map(char => {
      const user = userMap[char.userId] || {};
      // Filter suspended users
      if (user.isSuspended) return null;

      // Extract animal data from embedded object or fallback
      const animal = char.animal || {};

      return {
        id: char.id,
        userId: char.userId,
        characterName: char.characterName,
        animalName: animal.korean_name || '알 수 없음',
        animalIcon: animal.emoji || '🐾',
        animalCategory: animal.category || 'unknown', // Note: category might be missing in embedded data if not saved
        playerName: user.displayName || '익명',
        isGuest: user.isGuest || false,
        isBot: !!char.isBot,
        baseScore: char.baseScore || 0,
        eloScore: char.eloScore || 1000,
        wins: char.wins || 0,
        losses: char.losses || 0,
        totalBattles: (char.totalActiveBattles || 0) + (char.totalPassiveBattles || 0),
        createdAt: char.createdAt ? (char.createdAt.toDate ? char.createdAt.toDate().toISOString() : new Date(char.createdAt).toISOString()) : null
      };
    }).filter(Boolean); // Remove nulls

    // Sort again just in case (though Firestore did it, filtering might affect if we used a different field)
    // Firestore ordered by orderField.

    // In-memory sort since we removed Firestore orderBy to avoid composite index requirements
    characters.sort((a: any, b: any) => {
      let valA = 0;
      let valB = 0;

      switch (sortBy) {
        case 'elo':
          valA = a.eloScore;
          valB = b.eloScore;
          break;
        case 'wins':
          valA = a.wins;
          valB = b.wins;
          break;
        case 'totalBattles':
          valA = a.totalBattles;
          valB = b.totalBattles;
          break;
        case 'base':
        default:
          valA = a.baseScore;
          valB = b.baseScore;
          break;
      }
      
      return valB - valA; // Descending
    });

    // Client side category filter (if category not in OrderBy)
    // Note: To filter by category in Firestore, we need a composite index. 
    // For now, doing in-memory as originally done.
    if (category && category !== 'all') {
      // We need need category in the character data.
      // If 'animal' object in character has category, good.
      // Else we might fail to filter.
      // Assuming 'animal' object has it (added in POST).
      characters = characters.filter((char: any) => char.animalCategory === category);
    }

    // Top 25
    const leaderboard = characters.slice(0, 25).map((char: any, index: number) => {
      const totalBattles = char.totalBattles;
      const winRate = totalBattles > 0
        ? Math.round((char.wins / totalBattles) * 100)
        : 0;

      return {
        rank: index + 1,
        ...char,
        winRate
      };
    });

    // Stats (Simple Approximation since we don't fetch ALL for stats to save reads)
    // To get real totals, we should use aggregation queries or counters.
    // For now, returning 0 or partial stats is acceptable for MVP, or we can do a separate count query.

    const countSnap = await adminDb.collection('characters').count().get();
    const totalCharacters = countSnap.data().count;

    return NextResponse.json({
      success: true,
      data: {
        leaderboard,
        stats: {
          totalCharacters,
          averageElo: 1000, // Hard to calc avg without reading all. Defaulting.
          highestElo: leaderboard.length > 0 ? leaderboard[0].eloScore : 1000,
          mostPopularAnimal: getMostPopularAnimal(characters) // From the top 50 fetched
        },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Leaderboard fetch error:', error);
    return NextResponse.json({
      success: false,
      error: '리더보드를 불러오는 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}

// 가장 인기 있는 동물 찾기
function getMostPopularAnimal(characters: any[]) {
  const animalCounts: Record<string, number> = {};

  characters.forEach(char => {
    const animalName = char.korean_name || '알 수 없음';
    animalCounts[animalName] = (animalCounts[animalName] || 0) + 1;
  });

  let mostPopular = { name: '없음', count: 0 };
  Object.entries(animalCounts).forEach(([name, count]) => {
    if (count > mostPopular.count) {
      mostPopular = { name, count };
    }
  });

  return mostPopular;
}
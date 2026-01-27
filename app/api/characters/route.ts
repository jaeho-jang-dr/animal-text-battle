import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { animalsData, AnimalData } from '../../../data/animals-extended';
import { filterCharacterName, filterBattleText } from '../../../lib/filters/content-filter';

// Helper to get animal data
const getAnimalData = (animalId: number): AnimalData | undefined => {
  // animalsData index is ID-1
  return animalsData[animalId - 1];
};
// import { logUserAction } from '../../../lib/activity-tracker'; // Need refactor
// import { getSetting } from '../../../lib/settings-helper'; // Need refactor
import { v4 as uuidv4 } from 'uuid';
import { Character, Animal } from '../../../types'; // Ensure types are imported

// Helper to get user from token
async function verifyUser(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    return decodedToken;
  } catch (e) {
    console.error("Token verification failed", e);
    return null;
  }
}

// GET: 사용자의 캐릭터 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const excludeUserId = searchParams.get('excludeUserId');

    // 1. 자신의 캐릭터 조회 또는 특정 유저 프로필 (Token optional for public profile, required for private info?)
    // Here we strictly follow existing logic:
    // If userId provided -> Public profile fetch
    // If excludeUserId provided -> Opponent fetch
    // If neither -> Fetch OWN characters (needs Auth)

    if (userId) {
      // Fetch characters for specific user
      const charsSnap = await adminDb.collection('characters')
        .where('userId', '==', userId)
        .where('isActive', '==', true)

        .get();

      const characters = charsSnap.docs.map(doc => doc.data() as Character);
      return NextResponse.json({ success: true, data: characters });
    }

    if (excludeUserId) {
      // Find opponents (simple implementation: limit 20, desc score)
      // Firestore limitation: != is not directly supported efficiently without exclusion index/logic.
      // We'll fetch top rankers and filter out excludeUserId in memory if needed, or use separate queries.
      // Ideally "opponents" are "everyone else".

      const opponentsSnap = await adminDb.collection('characters')
        .where('isActive', '==', true)
        .limit(30) // Fetch a bit more to filter
        .get();

      const opponents = opponentsSnap.docs
        .map(doc => doc.data() as Character)
        .filter(c => c.userId !== excludeUserId)
        .slice(0, 20);

      return NextResponse.json({ success: true, data: opponents });
    }

    // Fetch OWN characters
    const decodedUser = await verifyUser(request);
    if (!decodedUser) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다' }, { status: 401 });
    }

    const myCharsSnap = await adminDb.collection('characters')
      .where('userId', '==', decodedUser.uid)
      .where('isActive', '==', true)

      .get();

    // Calculate today battles
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const getLastResetDate = (val: any) => {
      if (!val) return new Date(0);
      if (typeof val.toDate === 'function') return val.toDate();
      return new Date(val);
    };

    const characters = myCharsSnap.docs.map(doc => {
      const data = doc.data() as Character;
      // Reset logic
      let activeBattlesToday = data.activeBattlesToday;
      const lastReset = getLastResetDate(data.lastBattleReset);
      lastReset.setHours(0, 0, 0, 0);

      if (lastReset < today) {
        activeBattlesToday = 0;
        // Optionally update DB here or just return computed value
      }

      return {
        ...data,
        activeBattlesToday,
        canBattleToday: activeBattlesToday < 10,
        remainingBattles: Math.max(0, 10 - activeBattlesToday)
      };
    });


    return NextResponse.json({ success: true, data: characters });

  } catch (error) {
    console.error('Characters fetch error:', error);
    return NextResponse.json({ success: false, error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const decodedUser = await verifyUser(request);

    if (!decodedUser) {
      return NextResponse.json({ success: false, error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    const { animalId, characterName, battleText } = body;

    console.log("Creating character:", { uid: decodedUser.uid, animalId, characterName });

    if (!animalId || !characterName || !battleText) {
      return NextResponse.json({ success: false, error: '필수 정보가 누락되었습니다' }, { status: 400 });
    }

    // Validate Animal
    const animalData = getAnimalData(animalId);
    if (!animalData) {
      return NextResponse.json({ success: false, error: '잘못된 동물 선택입니다' }, { status: 400 });
    }

    const characterId = uuidv4();

    // Construct new character object
    // Note: We are using a plain object, converting timestamps later if needed, 
    // but admin SDK supports FieldValue.serverTimestamp() fine.
    const newCharacter = {
      id: characterId,
      userId: decodedUser.uid,
      animalId,
      characterName,
      battleText,
      // Default stats
      baseScore: 1000,
      eloScore: 1000,
      wins: 0,
      losses: 0,
      isActive: true,
      activeBattlesToday: 0,
      lastBattleReset: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      // Embedded animal data for easy fetch without join
      animal: {
        id: animalId,
        name: animalData.name,
        korean_name: animalData.korean_name,
        category: animalData.category,
        sub_category: animalData.sub_category,
        emoji: animalData.emoji,
        description: animalData.description,
        kid_description: animalData.kid_description,
        habitat: animalData.habitat,
        food: animalData.food,
        speciality: animalData.speciality,
        fun_fact: animalData.fun_fact,
        power: animalData.power || 50,
        defense: animalData.defense || 50,
        speed: animalData.speed || 50,
        intelligence: animalData.intelligence || 50,
        battle_cry: animalData.battle_cry,
        rarity: animalData.rarity,
        unlock_level: animalData.unlock_level
      }
    };

    await adminDb.collection('characters').doc(characterId).set(newCharacter);

    return NextResponse.json({ success: true, data: { ...newCharacter, createdAt: new Date().toISOString() } });

  } catch (error: any) {
    console.error('Character creation error details:', error);
    return NextResponse.json({ success: false, error: '캐릭터 생성 중 오류가 발생했습니다: ' + error.message }, { status: 500 });
  }
}

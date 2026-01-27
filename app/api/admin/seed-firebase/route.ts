import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { animalsData } from '../../../../data/animals-extended';
import { v4 as uuidv4 } from 'uuid';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get('key');

  if (key !== 'dev-seed-123') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = [];
    const characters = [];

    // Create 5 dummy users
    for (let i = 1; i <= 5; i++) {
      const userId = `dummy_user_${i}`;
      const user = {
        uid: userId,
        email: `dummy${i}@test.com`,
        displayName: `Dummy ${i}`,
        photoURL: null,
        createdAt: FieldValue.serverTimestamp(),
        isGuest: false,
      };
      
      await adminDb.collection('users').doc(userId).set(user);
      users.push(userId);

      // Create character for this user
      // Pick random animal
      const animalId = Math.floor(Math.random() * animalsData.length) + 1;
      const animalData = animalsData[animalId - 1];
      
      if (!animalData) {
          console.error(`Animal data not found for ID ${animalId}`);
          continue;
      }

      const characterId = uuidv4();
      const newCharacter = {
        id: characterId,
        userId: userId,
        animalId: animalId,
        characterName: `Dummy Char ${i}`,
        battleText: "I am a dummy character for testing.",
        // Default stats
        baseScore: 1000 + Math.floor(Math.random() * 500), // Random score
        eloScore: 1000,
        wins: 0,
        losses: 0,
        isActive: true,
        activeBattlesToday: 0,
        lastBattleReset: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        // Embedded animal data
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
      characters.push(characterId);
    }

    return NextResponse.json({ 
      success: true, 
      message: `Seeded ${users.length} users and ${characters.length} characters` 
    });

  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

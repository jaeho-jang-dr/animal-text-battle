import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../../lib/firebase-admin';
import { animalsData } from '../../../../data/animals-extended';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const key = searchParams.get('key');

  if (key !== 'dev-seed-123') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Create NPC User
    const npcUserId = 'npc_admin_bot';
    await adminDb.collection('users').doc(npcUserId).set({
      displayName: 'Official NPC Bot',
      email: 'npc@animal-text-battle.com',
      photoURL: 'https://api.dicebear.com/7.x/bottts/svg?seed=npc_admin',
      createdAt: new Date(),
      isBot: true,
      role: 'admin'
    }, { merge: true });

    // 2. Define NPCs
    const npcs = [
      {
        name: 'Golden Mane',
        animal: 'Lion',
        score: 2850,
        elo: 1820,
        wins: 45,
        losses: 5,
        description: "나는 정글의 왕! 용감하고 강력한 사자다. 모든 동물들이 나를 존경한다. 내 포효 소리는 온 초원을 울린다!"
      },
      {
        name: 'Rainbow Horn',
        animal: 'Unicorn',
        score: 2600,
        elo: 1750,
        wins: 38,
        losses: 7,
        description: "마법의 숲에서 온 신비로운 유니콘! 내 뿔은 무지개빛으로 빛나고 치유의 힘을 가지고 있어. 순수한 마음만이 나를 볼 수 있지!"
      },
      {
        name: 'Dino King',
        animal: 'Tyrannosaurus Rex',
        score: 2400,
        elo: 1680,
        wins: 32,
        losses: 8,
        description: "백악기 최강의 포식자! 거대한 이빨과 강력한 턱으로 모든 것을 부순다. 나는 공룡의 왕이다! 라오오오어!"
      },
      {
        name: 'Flame Wing',
        animal: 'Dragon',
        score: 2200,
        elo: 1620,
        wins: 28,
        losses: 12,
        description: "하늘을 지배하는 전설의 드래곤! 내 입에서 나오는 불꽃은 모든 것을 태운다. 보물을 지키는 수호자이자 하늘의 제왕!"
      },
      {
        name: 'Wave Rider',
        animal: 'Dolphin',
        score: 2000,
        elo: 1580,
        wins: 25,
        losses: 15,
        description: "바다의 친구 돌고래! 똑똑하고 재빠르게 파도를 가르며 헤엄친다. 내 클릭 소리로 모든 것을 알 수 있어! 바다의 수호자!"
      },
      {
        name: 'Iron Fist',
        animal: 'Gorilla',
        score: 2500,
        elo: 1700,
        wins: 35,
        losses: 10,
        description: "내 주먹은 바위도 부순다! 정글의 진정한 힘을 보여주지. 덤벼라!"
      },
      {
        name: 'Shadow Hunter',
        animal: 'Fox',
        score: 1900,
        elo: 1550,
        wins: 20,
        losses: 15,
        description: "그림자 속에 숨어 너를 지켜보고 있지. 나의 꾀에 넘어가지 않게 조심해. 킥킥."
      },
      {
        name: 'Storm Eye',
        animal: 'Eagle',
        score: 2100,
        elo: 1600,
        wins: 26,
        losses: 14,
        description: "하늘에서 너의 모든 움직임을 보고 있다. 나의 날카로운 발톱을 피할 수 없을 것이다!"
      },
      {
        name: 'Jaws',
        animal: 'Shark',
        score: 2300,
        elo: 1650,
        wins: 30,
        losses: 12,
        description: "피 냄새가 나는군... 바다에서는 내가 법이다. 깊은 물속으로 끌고 가주마!"
      },
      {
        name: 'Frost Fang',
        animal: 'Fenrir',
        score: 2700,
        elo: 1780,
        wins: 40,
        losses: 6,
        description: "얼어붙은 대지의 분노를 느껴보아라! 신들도 나를 두려워한다. 세상의 끝이 도래했다!"
      },
      {
        name: 'Titan',
        animal: 'Elephant',
        score: 2400,
        elo: 1680,
        wins: 31,
        losses: 9,
        description: "나의 기억력은 완벽하다. 너의 패배도 영원히 기억해주마. 길을 비켜라!"
      },
      {
        name: 'Zen Master',
        animal: 'Panda',
        score: 1800,
        elo: 1500,
        wins: 18,
        losses: 18,
        description: "진정한 강함은 부드러움에서 나오는 법... 대나무처럼 유연하게, 하지만 꺾이지 않게."
      },
      {
        name: 'Silent Wing',
        animal: 'Owl',
        score: 1700,
        elo: 1480,
        wins: 15,
        losses: 20,
        description: "밤은 나의 시간이다. 어둠 속에서 지혜의 눈으로 너를 꿰뚫어 보겠다."
      },
      {
        name: 'Snap Jaw',
        animal: 'Crocodile',
        score: 2200,
        elo: 1620,
        wins: 27,
        losses: 13,
        description: "한 번 물면 절대 놓지 않아. 늪지대의 공포를 보여주마! 조용히 다가가서 콱!"
      },
      {
        name: 'Kick Boxer',
        animal: 'Kangaroo',
        score: 1950,
        elo: 1560,
        wins: 22,
        losses: 16,
        description: "내 발차기를 받아라! 링 위에서는 내가 챔피언이야. 홉! 홉! 원투 펀치!"
      },
      {
        name: 'Viper',
        animal: 'Basilisk',
        score: 2600,
        elo: 1750,
        wins: 37,
        losses: 8,
        description: "내 눈을 바라봐... 돌이 되어 부서져라! 독의 왕 앞에서 무릎 꿇어라."
      },
      {
        name: 'Flash',
        animal: 'Electric Cheetah',
        score: 2550,
        elo: 1720,
        wins: 36,
        losses: 9,
        description: "나보다 빠를 순 없어! 눈 깜짝할 사이에 끝내주지. 찌릿찌릿할 거야!"
      },
      {
        name: 'River Boss',
        animal: 'Hippo',
        score: 2350,
        elo: 1660,
        wins: 29,
        losses: 11,
        description: "강에서는 나를 건드리지 않는 게 좋아. 겉모습에 속지 마라, 화나면 누구보다 무섭다고!"
      },
      {
        name: 'Saber Tooth',
        animal: 'Saber-toothed Tiger',
        score: 2450,
        elo: 1690,
        wins: 33,
        losses: 10,
        description: "고대의 송곳니가 너를 꿰뚫을 것이다. 빙하기의 추위를 느껴라! 사냥을 시작하지."
      },
      {
        name: 'Thunder Horn',
        animal: 'Rhino',
        score: 2150,
        elo: 1610,
        wins: 24,
        losses: 14,
        description: "내 앞을 막지 마라! 모든 것을 뚫고 돌진한다! 단단한 피부는 뚫을 수 없을걸?"
      }
    ];

    const results = [];

    for (const npc of npcs) {
      const animalData = animalsData.find(a => a.name === npc.animal);
      
      if (!animalData) {
        console.error(`Animal data not found for ${npc.animal}`);
        results.push({ name: npc.name, status: 'error', message: 'Animal data not found' });
        continue;
      }

      const characterId = `npc_${npc.name.toLowerCase().replace(/\s+/g, '_')}`;
      
      const characterData = {
        userId: npcUserId,
        characterName: npc.name,
        battleText: npc.description,
        baseScore: npc.score,
        eloScore: npc.elo,
        wins: npc.wins,
        losses: npc.losses,
        activeBattlesToday: 0,
        totalActiveBattles: 0,
        totalPassiveBattles: 0,
        isActive: true,
        isBot: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        animal: animalData
      };

      await adminDb.collection('characters').doc(characterId).set(characterData);
      results.push({ name: npc.name, id: characterId, status: 'created' });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'NPCs seeded successfully',
      results 
    });

  } catch (error) {
    console.error('Error seeding NPCs:', error);
    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

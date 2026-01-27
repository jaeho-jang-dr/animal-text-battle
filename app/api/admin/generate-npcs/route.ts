
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

const NPC_PRESETS = [
    { name: '초보 독수리', emoji: '🦅', score: 800, animal: '독수리' },
    { name: '수련하는 곰', emoji: '🐻', score: 900, animal: '곰' },
    { name: '재빠른 치타', emoji: '🐆', score: 1100, animal: '치타' },
    { name: '지혜로운 부엉이', emoji: '🦉', score: 1050, animal: '부엉이' },
    { name: '강력한 사자', emoji: '🦁', score: 1300, animal: '사자' },
    { name: '무적의 코끼리', emoji: '🐘', score: 1400, animal: '코끼리' },
    { name: '교활한 여우', emoji: '🦊', score: 1000, animal: '여우' },
    { name: '용감한 호랑이', emoji: '🐯', score: 1350, animal: '호랑이' },
    { name: '평화로운 판다', emoji: '🐼', score: 950, animal: '판다' },
    { name: '느긋한 코알라', emoji: '🐨', score: 850, animal: '코알라' },
    { name: '장난꾸러기 원숭이', emoji: '🐵', score: 920, animal: '원숭이' },
    { name: '성실한 늑대', emoji: '🐺', score: 1150, animal: '늑대' },
    { name: '화려한 공작', emoji: '🦚', score: 980, animal: '공작' },
    { name: '단단한 코뿔소', emoji: '🦏', score: 1250, animal: '코뿔소' },
    { name: '전설의 유니콘', emoji: '🦄', score: 1600, animal: '유니콘' },
    { name: '불멸의 용', emoji: '🐲', score: 2000, animal: '용' },
    { name: '심해의 상어', emoji: '🦈', score: 1100, animal: '상어' },
    { name: '거대 고래', emoji: '🐋', score: 1450, animal: '고래' },
    { name: '날렵한 매', emoji: '🦅', score: 1080, animal: '매' },
    { name: '귀여운 토끼', emoji: '🐰', score: 700, animal: '토끼' },
];

export async function POST(request: NextRequest) {
    try {
        const { count = 20, key } = await request.json();

        if (key !== 'dev_secret') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const batch = adminDb.batch();
        const createdNpcs = [];

        // existing NPCs check could be added here, but for now we just append
        // Or we can delete existing NPCs first if requested? 
        // Let's just create new ones.

        for (let i = 0; i < count; i++) {
            const preset = NPC_PRESETS[i % NPC_PRESETS.length];
            const uniqueSuffix = i >= NPC_PRESETS.length ? ` ${Math.floor(i / NPC_PRESETS.length) + 1}` : '';
            const fullName = `${preset.name}${uniqueSuffix}`;

            const id = uuidv4();
            const npcRef = adminDb.collection('characters').doc(id);

            const npcData = {
                id,
                userId: 'BOT_MASTER',
                characterName: fullName,
                animal: {
                    korean_name: preset.animal,
                    emoji: preset.emoji,
                    category: 'bot',
                    name: 'NPC'
                },
                baseScore: preset.score + Math.floor(Math.random() * 100), // Slight variation
                eloScore: preset.score + Math.floor(Math.random() * 100),
                isBot: true,
                isActive: true,
                wins: Math.floor(Math.random() * 20),
                losses: Math.floor(Math.random() * 20),
                totalActiveBattles: 0,
                totalPassiveBattles: 0,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                battleText: `나는 ${fullName}이다! 덤벼라!`,
                isDespatched: true
            };

            batch.set(npcRef, npcData);
            createdNpcs.push(npcData);
        }

        await batch.commit();

        return NextResponse.json({ success: true, count: createdNpcs.length, data: createdNpcs });
    } catch (error) {
        console.error('NPC Gen Error:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

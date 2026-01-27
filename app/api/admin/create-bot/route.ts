
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        // Basic verification - check simple secret or assume dev environment usage
        const { searchParams } = new URL(request.url);
        if (searchParams.get('key') !== 'dev_secret') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { name, emoji, score } = await request.json();

        const id = uuidv4();
        const newBot = {
            id,
            userId: 'BOT_MASTER',
            characterName: name || '훈련 교관 곰',
            characterId: id,
            animal: {
                korean_name: '훈련용 동물',
                emoji: emoji || '🐻',
                category: 'bot',
                name: 'Training Bot'
            },
            baseScore: score || 1000,
            eloScore: score || 1000,
            isBot: true,
            isActive: true,
            wins: 0,
            losses: 0,
            totalActiveBattles: 0,
            totalPassiveBattles: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            battleText: '나는 훈련용 봇이다! 언제든 덤벼라!'
        };

        await adminDb.collection('characters').doc(id).set(newBot);

        return NextResponse.json({ success: true, data: newBot });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

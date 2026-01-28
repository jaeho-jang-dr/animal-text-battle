import { NextRequest, NextResponse } from 'next/server';
import { judgeBattleWithAI } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { attacker, defender } = body;

        if (!attacker || !defender) {
            return NextResponse.json({ success: false, error: '정보가 부족합니다.' }, { status: 400 });
        }

        const result = await judgeBattleWithAI(
            attacker.characterName,
            attacker.animal?.korean_name || attacker.animalName || '동물',
            attacker.battleText || "...",
            defender.characterName,
            defender.animal?.korean_name || defender.animalName || '동물',
            defender.battleText || "..."
        );

        return NextResponse.json({ success: true, result });
    } catch (error: any) {
        console.error('Battle Judge Error:', error);
        return NextResponse.json({ success: false, error: error.message || '판정 실패' }, { status: 500 });
    }
}

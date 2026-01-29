import { NextRequest, NextResponse } from 'next/server';
import { judgeBattle } from '@/lib/battle-rules';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { attacker, defender } = body;

        if (!attacker || !defender) {
            return NextResponse.json({ success: false, error: '정보가 부족합니다.' }, { status: 400 });
        }

        // 규칙 기반 판정 수행
        const battleResult = judgeBattle(
            attacker.battleText || "...",
            attacker.animal?.korean_name || attacker.animalName || '동물',
            defender.battleText || "...",
            defender.animal?.korean_name || defender.animalName || '동물'
        );

        return NextResponse.json({
            success: true,
            result: {
                winner: battleResult.winner,
                judgment: battleResult.judgment,
                reasoning: battleResult.reasoning,
                attackerScore: battleResult.attackerScore.total,
                defenderScore: battleResult.defenderScore.total
            }
        });
    } catch (error: any) {
        console.error('Battle Judge Error:', error);
        return NextResponse.json({ success: false, error: error.message || '판정 실패' }, { status: 500 });
    }
}

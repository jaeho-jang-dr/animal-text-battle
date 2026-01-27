import { NextRequest, NextResponse } from 'next/server';
import { generateBattleText } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { animalName, characterName } = body;

        if (!animalName || !characterName) {
            return NextResponse.json({ success: false, error: '정보가 부족합니다.' }, { status: 400 });
        }

        const text = await generateBattleText(animalName, characterName);

        return NextResponse.json({ success: true, text });
    } catch (error: any) {
        console.error('AI Text Gen Error:', error);
        return NextResponse.json({ success: false, error: error.message || '생성 실패' }, { status: 500 });
    }
}

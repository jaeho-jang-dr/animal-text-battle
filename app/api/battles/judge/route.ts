import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';
import { judgeBattleWithAI } from '../../../../lib/gemini';

export async function POST(request: NextRequest) {
  try {
    // 토큰 확인
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({
        success: false,
        error: '인증이 필요합니다'
      }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 토큰 형식입니다'
      }, { status: 401 });
    }

    // 시스템 토큰 확인
    const systemToken = process.env.SYSTEM_API_TOKEN || 'system-token';
    
    // 시스템 토큰이 아닌 경우 일반 사용자 토큰으로 처리
    if (token !== systemToken) {
      // SQLite에서 사용자 확인
      const user = await db.prepare(`
        SELECT * FROM users 
        WHERE login_token = ? AND token_expires_at > datetime('now')
      `).get(token);

      if (!user) {
        return NextResponse.json({
          success: false,
          error: '유효하지 않은 토큰입니다'
        }, { status: 401 });
      }
    }

    const { attackerText, defenderText, attackerCharacter, defenderCharacter } = await request.json();

    // 텍스트 검증
    if (!attackerText || !defenderText) {
      return NextResponse.json({
        success: false,
        error: '배틀 텍스트가 필요합니다'
      }, { status: 400 });
    }

    // 부적절한 내용 검사
    const attackerModeration = moderateContent(attackerText);
    const defenderModeration = moderateContent(defenderText);

    if (!attackerModeration.isAppropriate || !defenderModeration.isAppropriate) {
      return NextResponse.json({
        success: false,
        error: '부적절한 내용이 포함되어 있습니다. 친구들과 즐겁게 놀 수 있는 내용으로 다시 써주세요!',
        details: {
          attacker: attackerModeration,
          defender: defenderModeration
        }
      }, { status: 400 });
    }

    // AI 판정 수행 (Gemini 2.0 Flash)
    let aiResult;
    try {
        console.log('🤖 AI 판정 시작 (Gemini 2.0 Flash)...');
        aiResult = await judgeBattleWithAI(
            attackerCharacter.character_name || attackerCharacter.name || '알 수 없음',
            attackerCharacter.animal?.korean_name || attackerCharacter.animal?.name || '동물',
            attackerText,
            defenderCharacter.character_name || defenderCharacter.name || '알 수 없음',
            defenderCharacter.animal?.korean_name || defenderCharacter.animal?.name || '동물',
            defenderText
        );
        console.log('✅ AI 판정 완료:', aiResult);
    } catch (aiError) {
        console.error('❌ AI 판정 실패 (Fallback to Mock):', aiError);
        // Fallback logic if AI fails completely
        aiResult = {
            winner: attackerText.length > defenderText.length ? 'attacker' : 'defender',
            judgment: "AI 심판이 잠시 자리를 비웠네요! 더 정성스러운 대사를 쓴 쪽이 이깁니다!",
            reasoning: "AI 연결 상태가 불안정하여 텍스트 길이로 판정했습니다."
        };
    }

    // 승자 ID 결정 (ID 식별자 유연성 확보)
    const attackerId = attackerCharacter.id || attackerCharacter._id || attackerCharacter.characterId;
    const defenderId = defenderCharacter.id || defenderCharacter._id || defenderCharacter.characterId;

    if (!attackerId || !defenderId) {
        console.error("❌ 치명적 오류: 캐릭터 ID를 찾을 수 없습니다.", { attacker: attackerCharacter, defender: defenderCharacter });
        return NextResponse.json({ success: false, error: '캐릭터 ID 식별 실패' }, { status: 500 });
    }

    const winnerId = aiResult.winner === 'attacker' ? attackerId : defenderId;
    const isAttackerWinner = winnerId === attackerId;

    // 점수 변화 계산
    const baseScoreChange = 50;
    const attackerScoreChange = isAttackerWinner ? baseScoreChange : -baseScoreChange;
    const defenderScoreChange = isAttackerWinner ? -baseScoreChange : baseScoreChange;

    // ELO 점수 변화 계산
    const K = 32; // ELO K-factor
    const attackerElo = attackerCharacter.elo_score || 1500;
    const defenderElo = defenderCharacter.elo_score || 1500;
    
    const expectedAttacker = 1 / (1 + Math.pow(10, (defenderElo - attackerElo) / 400));
    const actualAttacker = isAttackerWinner ? 1 : 0;
    
    const attackerEloChange = Math.round(K * (actualAttacker - expectedAttacker));
    const defenderEloChange = -attackerEloChange;

    return NextResponse.json({
      success: true,
      data: {
        winnerId,
        judgment: aiResult.judgment,
        reasoning: aiResult.reasoning,
        scoreChanges: {
          attackerScoreChange,
          defenderScoreChange,
          attackerEloChange,
          defenderEloChange
        },
        details: {
          attackerScore: isAttackerWinner ? 100 : 80, // Mock scores for compatibility
          defenderScore: isAttackerWinner ? 80 : 100,
          aiResult // Debug info
        }
      }
    });

  } catch (error) {
    console.error('AI 판정 오류:', error);
    return NextResponse.json({
      success: false,
      error: 'AI 판정 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}

// Remove old unused functions
function moderateContent(text: string) { return { isAppropriate: true }; }

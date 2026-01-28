import { db } from '../db';
import {
  CharacterOverview,
  HeadToHeadStats,
  StatComparison,
  Achievement,
  AchievementComparison,
  StrengthWeaknessAnalysis,
  PredictiveAnalysis,
  ComparisonVisualization,
  ComparisonInsight
} from '../../types/battle-comparison';

export class BattleComparisonAnalyzer {
  // 캐릭터 개요 정보 가져오기
  static getCharacterOverview(characterId: string): CharacterOverview | null {
    const character = db.prepare(`
      SELECT 
        c.id,
        c.character_name as name,
        c.base_score,
        c.elo_score,
        c.created_at,
        a.name as animal_name,
        a.korean_name as animal_korean_name,
        a.emoji as animal_emoji
      FROM characters c
      JOIN animals a ON c.animal_id = a.id
      WHERE c.id = ?
    `).get(characterId) as any;

    if (!character) return null;

    return {
      id: character.id,
      name: character.name,
      animal: {
        name: character.animal_name,
        koreanName: character.animal_korean_name,
        emoji: character.animal_emoji
      },
      baseScore: character.base_score,
      eloScore: character.elo_score,
      createdAt: character.created_at
    };
  }

  // 헤드투헤드 전적 분석
  static getHeadToHeadStats(char1Id: string, char2Id: string): HeadToHeadStats {
    const battles = db.prepare(`
      SELECT 
        b.id,
        b.winner_id,
        b.created_at,
        CASE 
          WHEN b.winner_id = ? THEN ?
          ELSE ?
        END as loser_id,
        CASE 
          WHEN b.winner_id = ? THEN c1.character_name
          ELSE c2.character_name
        END as winner_name,
        CASE 
          WHEN b.winner_id = ? THEN b.attacker_score_change
          WHEN b.winner_id = ? THEN b.defender_score_change
          ELSE 0
        END as score_change
      FROM battles b
      JOIN characters c1 ON c1.id = ?
      JOIN characters c2 ON c2.id = ?
      WHERE 
        (b.attacker_id = ? AND b.defender_id = ?) OR
        (b.attacker_id = ? AND b.defender_id = ?)
      ORDER BY b.created_at DESC
      LIMIT 10
    `).all(
      char1Id, char1Id, char2Id,
      char1Id,
      char1Id, char2Id,
      char1Id, char2Id,
      char1Id, char2Id,
      char2Id, char1Id
    ) as any[];

    const char1Wins = battles.filter(b => b.winner_id === char1Id).length;
    const char2Wins = battles.filter(b => b.winner_id === char2Id).length;

    return {
      totalBattles: battles.length,
      character1Wins: char1Wins,
      character2Wins: char2Wins,
      lastBattleDate: battles[0]?.created_at,
      lastWinnerId: battles[0]?.winner_id,
      battleHistory: battles.slice(0, 5).map(b => ({
        battleId: b.id,
        winnerId: b.winner_id,
        winnerName: b.winner_name,
        scoreChange: b.score_change,
        date: b.created_at
      }))
    };
  }

  // 통계 비교 (최적화됨)
  static getStatComparison(char1Id: string, char2Id: string): StatComparison {
    // 1. 기본 통계 및 평균 점수 변화 (한 번의 쿼리로 두 캐릭터 모두 조회)
    const statsQuery = db.prepare(`
      SELECT 
        c.id,
        COUNT(b.id) as total_battles,
        SUM(CASE WHEN b.winner_id = c.id THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN b.winner_id != c.id AND b.winner_id IS NOT NULL THEN 1 ELSE 0 END) as losses,
        AVG(
          CASE 
            WHEN b.attacker_id = c.id THEN b.attacker_score_change
            ELSE b.defender_score_change
          END
        ) as avg_change
      FROM characters c
      LEFT JOIN battles b ON (b.attacker_id = c.id OR b.defender_id = c.id) AND b.winner_id IS NOT NULL
      WHERE c.id IN (?, ?)
      GROUP BY c.id
    `).all(char1Id, char2Id) as any[];

    // 데이터 매핑
    const statsMap = new Map(statsQuery.map(s => [s.id, s]));

    // 2. 랭킹 조회 (한 번의 쿼리로 처리)
    const ranks = db.prepare(`
      SELECT 
        id,
        (SELECT COUNT(*) + 1 FROM characters c2 WHERE c2.elo_score > c1.elo_score) as rank
      FROM characters c1
      WHERE id IN (?, ?)
    `).all(char1Id, char2Id) as any[];

    const rankMap = new Map(ranks.map(r => [r.id, r.rank]));

    // 3. 연승/연패 계산을 위한 최근 배틀 조회 (각각 조회하되 로직 재사용)
    const getStreak = (charId: string) => {
      const recentBattles = db.prepare(`
        SELECT winner_id
        FROM battles
        WHERE (attacker_id = ? OR defender_id = ?) AND winner_id IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 20
      `).all(charId, charId) as any[];

      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;

      for (const battle of recentBattles) {
        if (battle.winner_id === charId) {
          if (currentStreak >= 0) currentStreak++;
          else currentStreak = 1;
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          if (currentStreak <= 0) currentStreak--;
          else currentStreak = -1;
          tempStreak = 0;
        }
      }
      return { currentStreak, bestStreak };
    };

    const buildCharStats = (charId: string) => {
      const s = statsMap.get(charId) || { total_battles: 0, wins: 0, losses: 0, avg_change: 0 };
      const rank = rankMap.get(charId) || 0;
      const { currentStreak, bestStreak } = getStreak(charId);

      return {
        totalBattles: s.total_battles,
        wins: s.wins,
        losses: s.losses,
        winRate: s.total_battles > 0 
          ? Math.round((s.wins / s.total_battles) * 100)
          : 0,
        averageScoreChange: Math.round(s.avg_change || 0),
        currentStreak,
        bestStreak,
        rank
      };
    };

    return {
      character1: buildCharStats(char1Id),
      character2: buildCharStats(char2Id)
    };
  }

  // 성과 비교
  static getAchievementComparison(char1Id: string, char2Id: string, stats: StatComparison): AchievementComparison {
    const getAchievements = (charId: string, stats: any): Achievement[] => {
      const achievements: Achievement[] = [];

      // 마일스톤 성과
      if (stats.totalBattles >= 100) {
        achievements.push({
          type: 'milestone',
          title: '백전노장',
          description: '100번 이상의 배틀 참여',
          icon: '🎖️'
        });
      } else if (stats.totalBattles >= 50) {
        achievements.push({
          type: 'milestone',
          title: '경험자',
          description: '50번 이상의 배틀 참여',
          icon: '🥈'
        });
      }

      if (stats.wins >= 100) {
        achievements.push({
          type: 'milestone',
          title: '승리의 제왕',
          description: '100승 달성',
          icon: '👑'
        });
      } else if (stats.wins >= 50) {
        achievements.push({
          type: 'milestone',
          title: '승리자',
          description: '50승 달성',
          icon: '🏆'
        });
      }

      // 연승 성과
      if (stats.bestStreak >= 10) {
        achievements.push({
          type: 'streak',
          title: '연승의 달인',
          description: '10연승 이상 달성',
          icon: '🔥'
        });
      } else if (stats.bestStreak >= 5) {
        achievements.push({
          type: 'streak',
          title: '연승 행진',
          description: '5연승 이상 달성',
          icon: '✨'
        });
      }

      // 특별 성과
      if (stats.winRate >= 80 && stats.totalBattles >= 20) {
        achievements.push({
          type: 'special',
          title: '전설의 전사',
          description: '80% 이상 승률 (20경기 이상)',
          icon: '🌟'
        });
      } else if (stats.winRate >= 70 && stats.totalBattles >= 20) {
        achievements.push({
          type: 'special',
          title: '강력한 전사',
          description: '70% 이상 승률 (20경기 이상)',
          icon: '⭐'
        });
      }

      if (stats.rank && stats.rank <= 10) {
        achievements.push({
          type: 'special',
          title: 'TOP 10',
          description: `전체 ${stats.rank}위`,
          icon: '🏅'
        });
      }

      return achievements;
    };

    const char1Achievements = getAchievements(char1Id, stats.character1);
    const char2Achievements = getAchievements(char2Id, stats.character2);

    // 공통 성과 찾기
    const sharedAchievements = char1Achievements.filter(a1 =>
      char2Achievements.some(a2 => a2.title === a1.title)
    );

    return {
      character1Achievements: char1Achievements,
      character2Achievements: char2Achievements,
      sharedAchievements
    };
  }

  // 강점/약점 분석
  static analyzeStrengthsWeaknesses(
    char1Id: string, 
    char2Id: string, 
    stats: StatComparison,
    headToHead: HeadToHeadStats
  ): StrengthWeaknessAnalysis {
    const analyzeCharacter = (
      charStats: any, 
      opponentStats: any,
      isChar1: boolean
    ) => {
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      const opportunities: string[] = [];

      // 승률 비교
      if (charStats.winRate > opponentStats.winRate + 10) {
        strengths.push('상대보다 높은 승률');
      } else if (charStats.winRate < opponentStats.winRate - 10) {
        weaknesses.push('상대보다 낮은 승률');
        opportunities.push('배틀 텍스트 개선으로 승률 향상 가능');
      }

      // 경험 비교
      if (charStats.totalBattles > opponentStats.totalBattles * 1.5) {
        strengths.push('풍부한 배틀 경험');
      } else if (charStats.totalBattles < opponentStats.totalBattles * 0.5) {
        weaknesses.push('상대적으로 적은 경험');
        opportunities.push('더 많은 배틀로 경험 쌓기');
      }

      // 현재 컨디션
      if (charStats.currentStreak > 3) {
        strengths.push(`${charStats.currentStreak}연승 중! 좋은 컨디션`);
      } else if (charStats.currentStreak < -3) {
        weaknesses.push(`${Math.abs(charStats.currentStreak)}연패 중`);
        opportunities.push('새로운 전략으로 분위기 전환');
      }

      // 헤드투헤드 전적
      if (headToHead.totalBattles >= 3) {
        const myWins = isChar1 ? headToHead.character1Wins : headToHead.character2Wins;
        const theirWins = isChar1 ? headToHead.character2Wins : headToHead.character1Wins;
        
        if (myWins > theirWins) {
          strengths.push('이 상대와의 좋은 전적');
        } else if (myWins < theirWins) {
          weaknesses.push('이 상대에게 약한 모습');
          opportunities.push('상대 분석을 통한 전략 수정');
        }
      }

      // 평균 점수 변화
      if (charStats.averageScoreChange > opponentStats.averageScoreChange + 2) {
        strengths.push('효율적인 점수 획득');
      }

      // 랭킹
      if (charStats.rank && opponentStats.rank && charStats.rank < opponentStats.rank) {
        strengths.push(`더 높은 랭킹 (${charStats.rank}위)`);
      }

      return { strengths, weaknesses, opportunities };
    };

    return {
      character1: analyzeCharacter(stats.character1, stats.character2, true),
      character2: analyzeCharacter(stats.character2, stats.character1, false)
    };
  }

  // 예측 분석
  static generatePredictiveAnalysis(
    char1: CharacterOverview,
    char2: CharacterOverview,
    stats: StatComparison,
    headToHead: HeadToHeadStats
  ): PredictiveAnalysis {
    const factors: any[] = [];
    let char1Score = 0;
    let char2Score = 0;

    // 승률 비교 (가중치 30%)
    const winRateDiff = stats.character1.winRate - stats.character2.winRate;
    if (Math.abs(winRateDiff) > 5) {
      const winner = winRateDiff > 0 ? 1 : 2;
      const score = Math.min(Math.abs(winRateDiff) * 0.3, 30);
      
      if (winner === 1) char1Score += score;
      else char2Score += score;

      factors.push({
        factor: `승률 차이 (${Math.abs(winRateDiff)}%)`,
        impact: winner === 1 ? 'positive' : 'negative',
        weight: score / 100
      });
    }

    // 현재 컨디션 (가중치 20%)
    const streakDiff = stats.character1.currentStreak - stats.character2.currentStreak;
    if (Math.abs(streakDiff) > 2) {
      const winner = streakDiff > 0 ? 1 : 2;
      const score = Math.min(Math.abs(streakDiff) * 2, 20);
      
      if (winner === 1) char1Score += score;
      else char2Score += score;

      factors.push({
        factor: '현재 연승/연패 상태',
        impact: winner === 1 ? 'positive' : 'negative',
        weight: score / 100
      });
    }

    // 헤드투헤드 전적 (가중치 25%)
    if (headToHead.totalBattles >= 3) {
      const h2hDiff = headToHead.character1Wins - headToHead.character2Wins;
      if (h2hDiff !== 0) {
        const winner = h2hDiff > 0 ? 1 : 2;
        const score = Math.min(Math.abs(h2hDiff) * 5, 25);
        
        if (winner === 1) char1Score += score;
        else char2Score += score;

        factors.push({
          factor: `상대 전적 (${headToHead.character1Wins}승 ${headToHead.character2Wins}패)`,
          impact: winner === 1 ? 'positive' : 'negative',
          weight: score / 100
        });
      }
    }

    // ELO 점수 차이 (가중치 15%)
    const eloDiff = char1.eloScore - char2.eloScore;
    if (Math.abs(eloDiff) > 50) {
      const winner = eloDiff > 0 ? 1 : 2;
      const score = Math.min(Math.abs(eloDiff) / 10, 15);
      
      if (winner === 1) char1Score += score;
      else char2Score += score;

      factors.push({
        factor: `ELO 점수 차이 (${Math.abs(eloDiff)}점)`,
        impact: winner === 1 ? 'positive' : 'negative',
        weight: score / 100
      });
    }

    // 경험 차이 (가중치 10%)
    const expDiff = stats.character1.totalBattles - stats.character2.totalBattles;
    if (Math.abs(expDiff) > 10) {
      const winner = expDiff > 0 ? 1 : 2;
      const score = Math.min(Math.abs(expDiff) / 10, 10);
      
      if (winner === 1) char1Score += score;
      else char2Score += score;

      factors.push({
        factor: `경험 차이 (${Math.abs(expDiff)}경기)`,
        impact: winner === 1 ? 'positive' : 'negative',
        weight: score / 100
      });
    }

    // 예측 결과 계산
    const totalScore = char1Score + char2Score;
    const char1Probability = totalScore > 0 ? char1Score / totalScore : 0.5;
    const char2Probability = 1 - char1Probability;

    const predictedWinner = char1Probability >= char2Probability
      ? { characterId: char1.id, characterName: char1.name, probability: char1Probability }
      : { characterId: char2.id, characterName: char2.name, probability: char2Probability };

    // 신뢰도 계산
    const probabilityDiff = Math.abs(char1Probability - char2Probability);
    const confidence = probabilityDiff > 0.3 ? 'high' : probabilityDiff > 0.15 ? 'medium' : 'low';

    // 추론 생성
    let reasoning = `${predictedWinner.characterName}의 승리 확률이 ${Math.round(predictedWinner.probability * 100)}%로 예측됩니다. `;
    
    if (confidence === 'high') {
      reasoning += '여러 지표가 일관되게 한 쪽의 우세를 나타내고 있습니다.';
    } else if (confidence === 'medium') {
      reasoning += '몇 가지 중요한 지표에서 우위를 보이고 있습니다.';
    } else {
      reasoning += '두 캐릭터의 실력이 비슷해 예측이 어렵습니다.';
    }

    return {
      predictedWinner,
      factors,
      confidence,
      reasoning
    };
  }

  // 시각화 데이터 생성
  static generateVisualizationData(
    char1Id: string,
    char2Id: string,
    stats: StatComparison
  ): ComparisonVisualization {
    // 레이더 차트 데이터
    const radarChartData = {
      categories: ['승률', '총 배틀', '평균 점수', '현재 연승', '최고 연승', '랭킹'],
      character1Values: [
        stats.character1.winRate,
        Math.min(stats.character1.totalBattles / 2, 100), // 정규화
        Math.max(0, stats.character1.averageScoreChange + 50), // 0-100 범위로 조정
        Math.max(0, (stats.character1.currentStreak + 10) * 5), // 정규화
        Math.min(stats.character1.bestStreak * 10, 100), // 정규화
        Math.max(0, 100 - (stats.character1.rank || 100)) // 랭킹 역순
      ],
      character2Values: [
        stats.character2.winRate,
        Math.min(stats.character2.totalBattles / 2, 100),
        Math.max(0, stats.character2.averageScoreChange + 50),
        Math.max(0, (stats.character2.currentStreak + 10) * 5),
        Math.min(stats.character2.bestStreak * 10, 100),
        Math.max(0, 100 - (stats.character2.rank || 100))
      ]
    };

    // 추세 비교 데이터 (최근 7일)
    const trendData = db.prepare(`
      WITH RECURSIVE dates(date) AS (
        SELECT date('now', '-6 days')
        UNION ALL
        SELECT date(date, '+1 day')
        FROM dates
        WHERE date < date('now')
      ),
      char1_daily AS (
        SELECT 
          DATE(created_at) as battle_date,
          SUM(CASE 
            WHEN attacker_id = ? THEN attacker_score_change
            ELSE defender_score_change
          END) as daily_score_change
        FROM battles
        WHERE (attacker_id = ? OR defender_id = ?)
          AND created_at >= date('now', '-6 days')
        GROUP BY DATE(created_at)
      ),
      char2_daily AS (
        SELECT 
          DATE(created_at) as battle_date,
          SUM(CASE 
            WHEN attacker_id = ? THEN attacker_score_change
            ELSE defender_score_change
          END) as daily_score_change
        FROM battles
        WHERE (attacker_id = ? OR defender_id = ?)
          AND created_at >= date('now', '-6 days')
        GROUP BY DATE(created_at)
      )
      SELECT 
        d.date,
        COALESCE(c1.daily_score_change, 0) as char1_change,
        COALESCE(c2.daily_score_change, 0) as char2_change
      FROM dates d
      LEFT JOIN char1_daily c1 ON d.date = c1.battle_date
      LEFT JOIN char2_daily c2 ON d.date = c2.battle_date
      ORDER BY d.date
    `).all(
      char1Id, char1Id, char1Id,
      char2Id, char2Id, char2Id
    ) as any[];

    // 누적 점수 계산
    let char1CumulativeScore = 1000;
    let char2CumulativeScore = 1000;
    
    const trendComparison = {
      dates: trendData.map(d => d.date),
      character1Scores: trendData.map(d => {
        char1CumulativeScore += d.char1_change;
        return char1CumulativeScore;
      }),
      character2Scores: trendData.map(d => {
        char2CumulativeScore += d.char2_change;
        return char2CumulativeScore;
      })
    };

    return {
      radarChartData,
      trendComparison
    };
  }

  // 비교 인사이트 생성
  static generateComparisonInsights(
    char1: CharacterOverview,
    char2: CharacterOverview,
    stats: StatComparison,
    headToHead: HeadToHeadStats,
    prediction: PredictiveAnalysis
  ): ComparisonInsight[] {
    const insights: ComparisonInsight[] = [];

    // 라이벌 관계
    if (headToHead.totalBattles >= 10) {
      insights.push({
        type: 'rivalry',
        message: `🔥 ${char1.name}와 ${char2.name}는 ${headToHead.totalBattles}번의 숙명의 대결을 펼쳤어요!`,
        targetCharacter: 'both',
        icon: '🔥'
      });
    } else if (headToHead.totalBattles >= 5) {
      insights.push({
        type: 'rivalry',
        message: `⚔️ 라이벌 관계가 형성되고 있어요! ${headToHead.totalBattles}번 대결했네요.`,
        targetCharacter: 'both',
        icon: '⚔️'
      });
    }

    // 압도적 우위
    if (headToHead.totalBattles >= 5) {
      if (headToHead.character1Wins > headToHead.character2Wins * 2) {
        insights.push({
          type: 'advantage',
          message: `💪 ${char1.name}가 ${char2.name}에게 압도적으로 강해요!`,
          targetCharacter: 'character1',
          icon: '💪'
        });
      } else if (headToHead.character2Wins > headToHead.character1Wins * 2) {
        insights.push({
          type: 'advantage',
          message: `💪 ${char2.name}가 ${char1.name}에게 압도적으로 강해요!`,
          targetCharacter: 'character2',
          icon: '💪'
        });
      }
    }

    // 승률 차이
    const winRateDiff = Math.abs(stats.character1.winRate - stats.character2.winRate);
    if (winRateDiff > 20) {
      const higherWinRateChar = stats.character1.winRate > stats.character2.winRate ? char1 : char2;
      insights.push({
        type: 'advantage',
        message: `📊 ${higherWinRateChar.name}의 승률이 ${winRateDiff}% 더 높아요!`,
        targetCharacter: stats.character1.winRate > stats.character2.winRate ? 'character1' : 'character2',
        icon: '📊'
      });
    }

    // 경험 차이
    const expDiff = Math.abs(stats.character1.totalBattles - stats.character2.totalBattles);
    if (expDiff > 50) {
      const moreExpChar = stats.character1.totalBattles > stats.character2.totalBattles ? char1 : char2;
      insights.push({
        type: 'fun_fact',
        message: `🎯 ${moreExpChar.name}가 ${expDiff}경기나 더 많이 싸웠어요!`,
        targetCharacter: stats.character1.totalBattles > stats.character2.totalBattles ? 'character1' : 'character2',
        icon: '🎯'
      });
    }

    // 현재 컨디션
    if (stats.character1.currentStreak >= 5) {
      insights.push({
        type: 'advantage',
        message: `🔥 ${char1.name}는 현재 ${stats.character1.currentStreak}연승 중! 기세가 대단해요!`,
        targetCharacter: 'character1',
        icon: '🔥'
      });
    }
    if (stats.character2.currentStreak >= 5) {
      insights.push({
        type: 'advantage',
        message: `🔥 ${char2.name}는 현재 ${stats.character2.currentStreak}연승 중! 기세가 대단해요!`,
        targetCharacter: 'character2',
        icon: '🔥'
      });
    }

    // 예측 기반 인사이트
    if (prediction.confidence === 'high') {
      insights.push({
        type: 'suggestion',
        message: `🎲 예측: ${prediction.predictedWinner.characterName}의 승리 가능성이 ${Math.round(prediction.predictedWinner.probability * 100)}%로 높아요!`,
        targetCharacter: prediction.predictedWinner.characterId === char1.id ? 'character1' : 'character2',
        icon: '🎲'
      });
    } else if (prediction.confidence === 'low') {
      insights.push({
        type: 'fun_fact',
        message: '🤔 두 캐릭터의 실력이 막상막하! 누가 이길지 예측하기 어려워요!',
        targetCharacter: 'both',
        icon: '🤔'
      });
    }

    // 동물 매치업
    if (char1.animal.koreanName === char2.animal.koreanName) {
      insights.push({
        type: 'fun_fact',
        message: `${char1.animal.emoji} 같은 동물끼리의 대결! 누가 진짜 ${char1.animal.koreanName}의 왕일까요?`,
        targetCharacter: 'both',
        icon: char1.animal.emoji
      });
    }

    // 격려 메시지
    if (stats.character1.winRate < 40 && stats.character1.totalBattles >= 10) {
      insights.push({
        type: 'suggestion',
        message: `💡 ${char1.name}, 배틀 텍스트를 수정해서 새로운 전략을 시도해보세요!`,
        targetCharacter: 'character1',
        icon: '💡'
      });
    }
    if (stats.character2.winRate < 40 && stats.character2.totalBattles >= 10) {
      insights.push({
        type: 'suggestion',
        message: `💡 ${char2.name}, 배틀 텍스트를 수정해서 새로운 전략을 시도해보세요!`,
        targetCharacter: 'character2',
        icon: '💡'
      });
    }

    return insights;
  }
}
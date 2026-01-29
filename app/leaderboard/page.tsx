'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { User, Character } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import BattlePreparation from '../../components/BattlePreparation';
import BottomNav from '../../components/BottomNav';

interface LeaderboardEntry {
  rank: number;
  id: string;
  userId: string;
  characterName: string;
  animalName: string;
  animalIcon: string;
  animalCategory: string;
  playerName: string;
  isGuest: boolean;
  isBot?: boolean;
  baseScore: number;
  eloScore: number;
  wins: number;
  losses: number;
  totalBattles: number;
  winRate: number;
  createdAt: string;
  battleText?: string;
  animal?: any;
}


interface BattleMode {
  isActive: boolean;
  myCharacter: Character | null;
  opponent: LeaderboardEntry | null;
  result: any | null;
  isBattling: boolean;
}

import { Suspense } from 'react';

function LeaderboardContent() {
  const searchParams = useSearchParams();

  const attackerId = searchParams.get('attackerId');
  const [attackerCharacter, setAttackerCharacter] = useState<Character | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'elo' | 'base' | 'wins' | 'totalBattles'>('base');
  const { user, firebaseUser } = useAuth();
  const [myCharacters, setMyCharacters] = useState<Character[]>([]);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<LeaderboardEntry | null>(null);
  const [battleMode, setBattleMode] = useState<BattleMode>({
    isActive: false,
    myCharacter: null,
    opponent: null,
    result: null,
    isBattling: false
  });
  const [dailyBattleLimit, setDailyBattleLimit] = useState(10);
  const [showBots, setShowBots] = useState(false);

  useEffect(() => {
    if (attackerId) {
      fetchCharacterDetails(attackerId).then(data => {
        if (data) {
          setAttackerCharacter(data);
          // If we have an attacker, we might want to ensure we are logged in or at least have the character context
          // But for now just setting it for display and action is enough
        }
      });
    }
  }, [attackerId]);

  useEffect(() => {
    fetchLeaderboard();
    loadBattleLimit();
  }, [category, sortBy, showBots]);

  useEffect(() => {
    if (user?.id) {
      const fetchMyCharacters = async () => {
        try {
          if (!firebaseUser) return;
          const token = await firebaseUser.getIdToken();
          const response = await fetch('/api/characters', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          if (data.success) {
            setMyCharacters(data.data);
          }
        } catch (err) {
          console.error("Failed to fetch my characters:", err);
        }
      };
      fetchMyCharacters();
    }
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // API 호출로 변경
      const response = await fetch('/api/leaderboard', { cache: 'no-store' });
      const resData = await response.json();

      if (!resData.success) {
        throw new Error(resData.error || 'Failed to fetch leaderboard');
      }

      const characters = resData.data as Character[];

      // Client-side processing
      const fetchedEntries: LeaderboardEntry[] = [];
      let rankCounter = 1;

      characters.forEach((data) => {
        // Client-side filtering
        if (showBots && !data.isBot) return;
        if (!showBots && data.isBot) return;

        if (category !== 'all' && data.animal?.category !== category) return;

        let resolvedPlayerName = '';
        if (data.isBot) {
          resolvedPlayerName = 'NPC';
        } else {
          // 이메일의 @ 앞부분을 로그인 아이디로 표시 (최대 8자)
          resolvedPlayerName = (data as any).user?.loginId || '';
        }

        fetchedEntries.push({
          rank: 0, // Will be set after sort
          id: data.id,
          userId: data.userId,
          characterName: data.characterName,
          animalName: data.animal?.name || '?',
          animalIcon: data.animal?.emoji || '🐾',
          animalCategory: data.animal?.category || 'unknown',
          playerName: resolvedPlayerName,
          isGuest: (data as any).user?.isGuest || false,
          isBot: data.isBot,
          baseScore: data.baseScore,
          eloScore: data.eloScore,
          wins: data.wins,
          losses: data.losses,
          totalBattles: data.totalActiveBattles + (data.totalPassiveBattles || 0),
          winRate: (data.wins + data.losses) > 0 ? Math.round((data.wins / (data.wins + data.losses)) * 100) : 0,
          createdAt: data.createdAt?.toString() || '',
          battleText: data.battleText,
          animal: data.animal
        });
      });

      // Sort in memory
      fetchedEntries.sort((a, b) => {
        if (sortBy === 'elo') return b.eloScore - a.eloScore;
        if (sortBy === 'wins') return b.wins - a.wins;
        // if (sortBy === 'totalBattles') return b.totalBattles - a.totalBattles;
        return b.baseScore - a.baseScore;
      });

      // Limit locally if needed (e.g. top 100)
      const limitedEntries = fetchedEntries.slice(0, 100);

      // Re-rank after filter
      limitedEntries.forEach((e, i) => e.rank = i + 1);

      setEntries(limitedEntries);
    } catch (error) {
      console.error('Leaderboard fetch error:', error);
      setError('리더보드 데이터를 불러올 수 없습니다. (API Error)');
    } finally {
      setIsLoading(false);
    }
  };

  // 상대 캐릭터의 상세 정보 가져오기 (via API)
  const fetchCharacterDetails = async (characterId: string) => {
    try {
      const response = await fetch(`/api/characters/${characterId}`);
      const data = await response.json();
      if (data.success) {
        return data.data as Character;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch character details:', error);
      return null;
    }
  };

  const loadBattleLimit = async () => {
    try {
      const response = await fetch(`/api/settings/battle-limit?_t=${Date.now()}`);
      const data = await response.json();
      if (data.success) {
        setDailyBattleLimit(data.data.dailyBattleLimit);
        console.log('Battle limit loaded:', data.data.dailyBattleLimit);
      }
    } catch (error) {
      console.error('Failed to load battle limit:', error);
    }
  };

  const startBattle = async (opponent: LeaderboardEntry) => {
    // Battle Mode: Direct battle with pre-selected attacker
    if (attackerId && attackerCharacter) {
      if (attackerCharacter.id === opponent.id) {
        alert('자기 자신과는 싸울 수 없어요!');
        return;
      }

      // 상대 캐릭터의 상세 정보 가져오기
      const opponentDetails = await fetchCharacterDetails(opponent.id);
      if (opponentDetails) {
        opponent.battleText = opponentDetails.battleText;
        opponent.animal = opponentDetails.animal;
      }

      selectCharacterForBattle(attackerCharacter, opponent);
      return;
    }

    if (!user) {
      alert('배틀하려면 로그인이 필요해요!');
      window.location.href = '/';
      return;
    }

    if (myCharacters.length === 0) {
      alert('먼저 캐릭터를 만들어주세요!');
      window.location.href = '/play';
      return;
    }

    // 상대 캐릭터의 상세 정보 가져오기
    const opponentDetails = await fetchCharacterDetails(opponent.id);
    if (opponentDetails) {
      opponent.battleText = opponentDetails.battleText;
      opponent.animal = opponentDetails.animal;
    }

    setSelectedOpponent(opponent);
    setShowCharacterSelect(true);
  };

  const selectCharacterForBattle = async (character: Character, directOpponent?: LeaderboardEntry) => {
    const opponent = directOpponent || selectedOpponent;
    if (!opponent) return;

    // 봇과의 배틀은 일일 제한 없음
    if (!opponent.isBot && character.activeBattlesToday >= dailyBattleLimit) {
      alert(`이 캐릭터는 오늘 배틀을 모두 마쳤어요! (${dailyBattleLimit}회)\n🤖 대기 계정과는 무제한 배틀이 가능해요!`);
      return;
    }

    // 내 캐릭터의 상세 정보 가져오기 (배틀 텍스트 포함)
    const characterDetails = await fetchCharacterDetails(character.id);
    if (characterDetails) {
      character.battleText = characterDetails.battleText;
      character.animal = characterDetails.animal;
    }

    setBattleMode({
      isActive: true,
      myCharacter: character,
      opponent: opponent,
      result: null,
      isBattling: false
    });
    setShowCharacterSelect(false);
  };

  const executeBattle = async () => {
    if (!battleMode.myCharacter || !battleMode.opponent) return;

    setBattleMode(prev => ({ ...prev, isBattling: true }));

    try {
      const attacker = battleMode.myCharacter;
      const defender = battleMode.opponent;

      if (!attacker || !defender) return;

      // 1. Calculate Battle Result locally (skipping complex Gemini judgment for now to fix error)
      // 1. Call AI Judgment API
      const response = await fetch('/api/ai/judge-battle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attacker: {
            characterName: attacker.characterName,
            animalName: attacker.animal?.korean_name,
            battleText: attacker.battleText
          },
          defender: {
            characterName: defender.characterName,
            animalName: defender.animal?.korean_name,
            battleText: defender.battleText
          }
        })
      });

      const data = await response.json();
      let battleResult;
      let winner;

      if (data.success) {
        battleResult = data.result;
        winner = battleResult.winner;
      } else {
        // Fallback logic if API fails
        console.error("Judge API Failed, using fallback:", data.error);
        const expectedScore = 1 / (1 + Math.pow(10, (defender.eloScore - attacker.eloScore) / 400));
        const actualScore = Math.random() < expectedScore ? 1 : 0;
        winner = actualScore === 1 ? 'attacker' : 'defender';
        battleResult = {
          winner,
          judgment: "심판이 잠시 자리를 비웠네요! 운으로 승부합니다!",
          reasoning: winner === 'attacker' ? "운이 좋았습니다!" : "상대방의 운이 더 좋았네요."
        };
      }

      const isWin = winner === 'attacker';

      const attackerScoreChange = isWin ? 10 : -5;
      const defenderScoreChange = isWin ? -5 : 10;

      const expectedScoreStats = 1 / (1 + Math.pow(10, (defender.eloScore - attacker.eloScore) / 400));
      const actualScoreStats = isWin ? 1 : 0;

      const K = 32;
      const attackerEloChange = Math.round(K * (actualScoreStats - expectedScoreStats));
      const defenderEloChange = Math.round(K * ((1 - actualScoreStats) - (1 - expectedScoreStats)));

      // 2. Call Battle Execution API
      if (!firebaseUser) throw new Error("Not logged in");
      const token = await firebaseUser.getIdToken();

      const execResponse = await fetch('/api/battles/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          attackerId: attacker.id,
          defenderId: defender.id,
          winnerId: isWin ? attacker.id : defender.id,
          attackerScoreChange,
          defenderScoreChange,
          attackerEloChange,
          defenderEloChange
        })
      });

      const execData = await execResponse.json();
      if (!execData.success) {
        throw new Error(execData.error || 'Battle execution failed on server');
      }

      const finalBattleResultData = {
        result: {
          winner: winner,
          winnerId: isWin ? attacker.id : defender.id,
          judgment: "AI 판정: " + (battleResult.judgment || "판정 결과 없음"),
          reasoning: battleResult.reasoning,
          attackerScoreChange: attackerScoreChange,
          attackerEloChange: attackerEloChange,
          encouragement: battleResult.encouragement
        },
        updatedStats: {
          attacker: {
            baseScore: attacker.baseScore + attackerScoreChange,
            eloScore: attacker.eloScore + attackerEloChange
          },
          defender: {
            baseScore: defender.baseScore + defenderScoreChange,
            eloScore: defender.eloScore + defenderEloChange
          }
        }
      };

      setBattleMode(prev => ({
        ...prev,
        result: finalBattleResultData,
        isBattling: false
      }));

      // 캐릭터 정보 업데이트 (Local State)
      const updatedCharacters = myCharacters.map(char => {
        if (char.id === battleMode.myCharacter!.id) {
          return {
            ...char,
            activeBattlesToday: char.activeBattlesToday + 1,
            wins: char.wins + (isWin ? 1 : 0),
            losses: char.losses + (isWin ? 0 : 1),
            baseScore: attacker.baseScore + attackerScoreChange,
            eloScore: attacker.eloScore + attackerEloChange
          };
        }
        return char;
      });
      setMyCharacters(updatedCharacters);

      // 리더보드 새로고침
      setTimeout(() => {
        fetchLeaderboard();
      }, 1000);

    } catch (error) {
      console.error('Battle error:', error);
      alert('배틀 실행 중 오류가 발생했어요');
      setBattleMode(prev => ({ ...prev, isBattling: false }));
    }
  };

  const closeBattleMode = () => {
    setBattleMode({
      isActive: false,
      myCharacter: null,
      opponent: null,
      result: null,
      isBattling: false
    });
    setSelectedOpponent(null);
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}위`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-100 border-yellow-400';
      case 2: return 'bg-gray-100 border-gray-400';
      case 3: return 'bg-orange-100 border-orange-400';
      default: return 'bg-white border-gray-200';
    }
  };

  const isMyCharacter = (characterId: string) => {
    return myCharacters.some(char => char.id === characterId);
  };

  const handleSeedBots = async () => {
    if (window.confirm('정말 20명의 AI 봇을 생성하시겠습니까? (이미 있으면 중복 생성되지 않습니다)')) {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/generate-npcs', { method: 'POST' });
        const data = await response.json();

        if (data.success) {
          alert(`봇 생성 완료: ${data.count}명 추가됨`);
          await fetchLeaderboard();
        } else {
          alert('봇 생성 실패: ' + data.error);
        }
      } catch (error) {
        console.error('Bot generation error:', error);
        alert('봇 생성 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pb-24">
      {/* 헤더 - Global Design System */}
      <div className="px-6 py-12 flex flex-col items-center bg-white/80 backdrop-blur-xl border border-white/50 shadow-sm rounded-b-[2.5rem] mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">🏆 명예의 전당</h1>
        <p className="text-lg font-medium text-slate-500">최강의 동물 전사들이 모인 곳!</p>
      </div>

      {/* Battle Mode Banner */}
      {attackerCharacter && (
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-xl border border-indigo-100 p-6 rounded-[2rem] shadow-xl flex items-center justify-between"
          >
            <div className="flex items-center gap-6">
              <div className="text-5xl bg-indigo-50 p-4 rounded-2xl shadow-inner">
                {attackerCharacter.animal?.emoji || '🐾'}
              </div>
              <div>
                <p className="text-indigo-500 text-xs font-black uppercase tracking-widest mb-1">CURRENTLY PLAYING AS</p>
                <h2 className="text-3xl font-black text-slate-900">{attackerCharacter.characterName}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-sm font-bold">
                    {attackerCharacter.animal?.korean_name}
                  </span>
                  <span className="text-slate-400 font-bold">|</span>
                  <span className="text-slate-600 font-bold">ELO {attackerCharacter.eloScore}</span>
                  <span className="text-slate-400 font-bold">|</span>
                  <span className="text-slate-600 font-bold">{attackerCharacter.wins}승 {attackerCharacter.losses}패</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => window.location.href = '/play'}
              className="bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-xl text-sm font-bold transition-all hover:scale-105 shadow-sm"
            >
              캐릭터 변경
            </button>
          </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-6">
        {/* 점수 계산법 설명 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl p-8 mb-6"
        >
          <h2 className="text-2xl font-bold mb-6 text-center">📊 순위 결정 방법</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-50 rounded-2xl p-6">
              <h3 className="font-bold text-green-700 mb-3 flex items-center gap-2">
                <span className="text-2xl">📈</span> 기본 점수
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>시작 점수</strong>: 모든 캐릭터는 1000점으로 시작</li>
                <li>• <strong>승리</strong>: +10점</li>
                <li>• <strong>패배</strong>: -5점 (최소 0점)</li>
                <li>• <strong>특징</strong>: 많이 플레이할수록 증가</li>
                <li>• <strong>용도</strong>: 활동량 측정</li>
                <li>• <strong>보너스</strong>: 연승 시 추가 점수 가능</li>
              </ul>
            </div>
            <div className="bg-blue-50 rounded-2xl p-6">
              <h3 className="font-bold text-blue-700 mb-3 flex items-center gap-2">
                <span className="text-2xl">🎯</span> ELO 점수 (실력 점수)
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>시작 점수</strong>: 모든 캐릭터는 1500점으로 시작</li>
                <li>• <strong>승리 시</strong>: 상대가 강할수록 많은 점수 획득</li>
                <li>• <strong>패배 시</strong>: 상대가 약할수록 많은 점수 감소</li>
                <li>• <strong>계산 방식</strong>: 국제 체스 랭킹과 동일한 ELO 시스템</li>
                <li>• <strong>공정성</strong>: 실력이 비슷한 상대와 매칭 유도</li>
              </ul>
            </div>
          </div>
          <div className="mt-6 bg-purple-50 rounded-2xl p-4 text-center">
            <p className="text-purple-700">
              💡 <strong>팁</strong>: 기본 점수로 정렬하면 활동 순위를, ELO 점수로 정렬하면 실력 순위를 볼 수 있어요!
            </p>
          </div>
        </motion.div>

        {/* 메인 탭 (랭킹 vs 훈련소) */}
        <div className="flex justify-center mb-10 gap-4">
          <button
            onClick={() => setCategory('all')}
            className={`px-8 py-4 rounded-2xl font-bold text-xl transition-all shadow-xl flex items-center gap-3 ${!showBots
              ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white scale-105 ring-4 ring-yellow-100'
              : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            onClickCapture={() => setShowBots(false)}
          >
            <span className="text-2xl">🏆</span>
            <span>전체 랭킹</span>
          </button>
          <button
            onClick={() => setCategory('all')}
            className={`px-8 py-4 rounded-2xl font-bold text-xl transition-all shadow-xl flex items-center gap-3 ${showBots
              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white scale-105 ring-4 ring-purple-100'
              : 'bg-white text-slate-400 hover:bg-slate-50 hover:text-slate-600'
              }`}
            onClickCapture={() => setShowBots(true)}
          >
            <span className="text-2xl">🤖</span>
            <span>NPC 훈련소</span>
          </button>
        </div>

        {/* 필터 옵션 (봇 화면에서는 숨기기) */}
        {!showBots && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* 카테고리 필터 */}
              <div className="flex items-center gap-2">
                <label className="font-bold text-gray-700">카테고리:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="all">🌍 전체</option>
                  <option value="current">🦁 현존 동물</option>
                  <option value="mythical">🦄 전설의 동물</option>
                  <option value="prehistoric">🦕 고생대 동물</option>
                </select>
              </div>

              {/* 정렬 옵션 */}
              <div className="flex items-center gap-2">
                <label className="font-bold text-gray-700">정렬:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
                >
                  <option value="base">📊 기본 점수</option>
                  <option value="elo">🎯 실력 점수</option>
                  <option value="wins">🏆 최다 승리</option>
                  <option value="totalBattles">⚔️ 최다 배틀</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-md"
            role="alert"
          >
            <p className="font-bold">오류 발생</p>
            <p>{error}</p>
          </motion.div>
        )}

        {/* 리더보드 테이블 */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 animate-bounce">⏳</div>
            <p className="text-xl font-bold text-slate-400">순위를 불러오는 중...</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl border border-white/50 rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-5 text-left text-sm font-black text-slate-400 uppercase tracking-wider">순위</th>
                    <th className="px-6 py-5 text-left text-sm font-black text-slate-400 uppercase tracking-wider">전사 정보</th>
                    <th className="px-6 py-5 text-left text-sm font-black text-slate-400 uppercase tracking-wider">동물</th>
                    <th className="px-6 py-5 text-center text-sm font-black text-slate-400 uppercase tracking-wider">점수</th>
                    <th className="px-6 py-5 text-center text-sm font-black text-slate-400 uppercase tracking-wider">승률</th>
                    <th className="px-6 py-5 text-center text-sm font-black text-slate-400 uppercase tracking-wider">전적</th>
                    <th className="px-6 py-5 text-center text-sm font-black text-slate-400 uppercase tracking-wider">액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries
                    .filter(e => showBots ? e.isBot : !e.isBot)
                    .map((entry) => (
                      <tr
                        key={entry.id}
                        className={`hover:bg-indigo-50/30 transition-colors ${user && entry.userId === user.id ? 'bg-indigo-50/50' : ''
                          }`}
                      >
                        <td className="px-6 py-5">
                          <div className="text-3xl font-black text-slate-300">
                            {getRankEmoji(entry.rank)}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="font-black text-lg text-slate-800">
                            {entry.characterName}
                            {entry.isBot && (
                              <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-bold">
                                NPC
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-medium text-slate-400">
                            {entry.isBot ? '' : entry.playerName ? `@${entry.playerName}` : ''}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl bg-white border border-slate-100 rounded-2xl p-2 shadow-sm">{entry.animalIcon}</span>
                            <span className="font-bold text-slate-600">{entry.animalName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="font-black text-xl text-slate-800">
                            {sortBy === 'base' || sortBy === 'score' ? entry.baseScore.toLocaleString() : entry.eloScore.toLocaleString()}
                          </div>
                          <div className="text-xs font-bold text-slate-400 uppercase tracking-wide">
                            {sortBy === 'base' || sortBy === 'score' ? 'POINTS' : 'ELO'}
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="font-black text-lg text-slate-700">
                            {entry.winRate}%
                          </div>
                          <div className="w-16 h-2 bg-slate-100 rounded-full mx-auto mt-1 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                              style={{ width: `${entry.winRate}%` }}
                            />
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="text-sm font-bold">
                            <span className="text-emerald-600">{entry.wins}승</span>
                            <span className="mx-1 text-slate-300">/</span>
                            <span className="text-rose-500">{entry.losses}패</span>
                          </div>
                          <div className="text-xs font-bold text-slate-400 mt-1">
                            총 {entry.totalBattles}전
                          </div>
                        </td>
                        <td className="px-6 py-5 text-center">
                          {user && entry.userId === user.id ? (
                            <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-sm font-bold">
                              나의 캐릭터
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => startBattle(entry)}
                                className={`${attackerId && attackerCharacter
                                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-indigo-200'
                                  : 'bg-gradient-to-r from-rose-500 to-orange-500 shadow-rose-200'
                                  } text-white font-bold py-2 px-5 rounded-xl text-sm shadow-lg hover:shadow-xl transition-all`}
                              >
                                {attackerId && attackerCharacter ? '⚔️ 바로 배틀!' : '⚔️ 도전!'}
                              </motion.button>
                              {entry.isBot && (
                                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">무제한 배틀</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {entries.length === 0 && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🦥</div>
                <p className="text-xl text-gray-600">
                  아직 순위에 오른 전사가 없어요!
                </p>
                <p className="text-gray-500 mt-2">
                  첫 번째 전사가 되어보세요!
                </p>
              </div>
            )}
          </div>
        )}

        {/* 하단 버튼들 */}
        <div className="mt-12 flex justify-center gap-6">
          <button
            onClick={() => window.location.href = '/play'}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all transform flex items-center gap-2"
          >
            <span>🎮</span> 게임으로 돌아가기
          </button>
          {!user && (
            <button
              onClick={() => window.location.href = '/'}
              className="bg-white text-slate-700 border border-slate-200 font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl hover:bg-slate-50 transition-all transform flex items-center gap-2"
            >
              <span>🔑</span> 로그인하기
            </button>
          )}
        </div>
      </div>

      {/* 캐릭터 선택 모달 */}
      {showCharacterSelect && selectedOpponent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-center mb-6">
              어떤 캐릭터로 도전할까요? 🤔
            </h2>

            <div className="mb-4 text-center">
              <p className="text-lg">
                상대: <span className="font-bold">{selectedOpponent.characterName}</span>
                ({selectedOpponent.animalIcon} {selectedOpponent.animalName})
                {selectedOpponent.isBot && (
                  <span className="ml-2 text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                    🤖 대기 계정
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-600">
                ELO: {selectedOpponent.eloScore} | 승률: {selectedOpponent.winRate}%
              </p>
              {selectedOpponent.isBot && (
                <p className="text-sm text-purple-600 font-medium mt-1">
                  ✨ 무제한 배틀 가능!
                </p>
              )}
            </div>

            <div className="grid gap-4 mb-6">
              {myCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => selectCharacterForBattle(character)}
                  disabled={!selectedOpponent?.isBot && character.activeBattlesToday >= dailyBattleLimit}
                  className={`p-4 rounded-xl border-2 transition-all ${!selectedOpponent?.isBot && character.activeBattlesToday >= dailyBattleLimit
                    ? 'bg-gray-100 border-gray-300 cursor-not-allowed opacity-50'
                    : 'bg-white border-blue-400 hover:bg-blue-50 hover:border-blue-600'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{character.animal?.emoji || '🐾'}</span>
                      <div className="text-left">
                        <p className="font-bold">{character.characterName}</p>
                        <p className="text-sm text-gray-600">
                          {character.animal?.korean_name} | ELO: {character.eloScore}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        오늘 배틀: {character.activeBattlesToday}/{dailyBattleLimit}
                      </p>
                      <p className="text-xs text-gray-600">
                        {character.wins}승 {character.losses}패
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setShowCharacterSelect(false);
                setSelectedOpponent(null);
              }}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-3 px-6 rounded-lg"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* 배틀 모달 */}
      {battleMode.isActive && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full">
            {!battleMode.result ? (
              <BattlePreparation
                attacker={battleMode.myCharacter}
                defender={battleMode.opponent}
                onBattleStart={executeBattle}
                onEditBattleText={() => {
                  // 리더보드에서는 배틀 텍스트 수정을 위해 play 페이지로 이동
                  window.location.href = '/play';
                }}
                onCancel={closeBattleMode}
                isBattling={battleMode.isBattling}
                showEditButton={true}
              />
            ) : (
              <>
                <h2 className="text-3xl font-bold text-center mb-6">
                  {battleMode.result.result.winner === 'attacker' ? '🎉 승리!' : '😢 패배...'}
                </h2>

                <div className="bg-blue-50 rounded-xl p-6 mb-6">
                  <p className="text-xl font-bold mb-2">{battleMode.result.result.judgment}</p>
                  <p className="text-gray-700 mb-4">{battleMode.result.result.reasoning}</p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">내 점수 변화</p>
                      <p className={`text-2xl font-bold ${battleMode.result.result.attackerScoreChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {battleMode.result.result.attackerScoreChange > 0 ? '+' : ''}
                        {battleMode.result.result.attackerScoreChange}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">ELO 변화</p>
                      <p className={`text-2xl font-bold ${battleMode.result.result.attackerEloChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {battleMode.result.result.attackerEloChange > 0 ? '+' : ''}
                        {battleMode.result.result.attackerEloChange}
                      </p>
                    </div>
                  </div>

                  {battleMode.result.result.encouragement && (
                    <p className="text-center text-lg font-medium text-purple-600">
                      {battleMode.result.result.encouragement}
                    </p>
                  )}
                </div>

                <button
                  onClick={closeBattleMode}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl text-lg"
                >
                  확인
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div className='min-h-screen flex items-center justify-center text-4xl'>Loading...</div>}>
      <LeaderboardContent />
    </Suspense>
  );
}

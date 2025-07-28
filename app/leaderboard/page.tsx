'use client';

import { useEffect, useState } from 'react';
import { User, Character } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaderboardEntry {
  rank: number;
  id: string;
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
}

interface BattleMode {
  isActive: boolean;
  myCharacter: Character | null;
  opponent: LeaderboardEntry | null;
  result: any | null;
  isBattling: boolean;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'score' | 'elo'>('elo');
  const [user, setUser] = useState<User | null>(null);
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

  useEffect(() => {
    checkAuth();
    fetchLeaderboard();
  }, [category, sortBy]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('/api/auth/verify', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (data.success) {
          setUser(data.data.user);
          setMyCharacters(data.data.user.characters || []);
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    }
  };

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (category !== 'all') params.append('category', category);
      params.append('sortBy', sortBy);

      console.log('📋 Fetching leaderboard...', `/api/leaderboard?${params}`);
      const response = await fetch(`/api/leaderboard?${params}`);
      console.log('🔄 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📦 Leaderboard data:', data);

      if (data.success) {
        setEntries(data.data.leaderboard || []);
        console.log('✅ Entries set:', data.data.leaderboard?.length || 0);
      } else {
        console.error('❌ API error:', data.error);
        alert('리더보드 데이터를 불러올 수 없습니다: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (error) {
      console.error('🔥 Leaderboard fetch error:', error);
      alert('리더보드를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const startBattle = (opponent: LeaderboardEntry) => {
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

    setSelectedOpponent(opponent);
    setShowCharacterSelect(true);
  };

  const selectCharacterForBattle = (character: Character) => {
    // 봇과의 배틀은 일일 제한 없음
    if (!selectedOpponent?.isBot && character.activeBattlesToday >= 10) {
      alert('이 캐릭터는 오늘 배틀을 모두 마쳤어요!\n🤖 대기 계정과는 무제한 배틀이 가능해요!');
      return;
    }

    setBattleMode({
      isActive: true,
      myCharacter: character,
      opponent: selectedOpponent,
      result: null,
      isBattling: false
    });
    setShowCharacterSelect(false);
  };

  const executeBattle = async () => {
    if (!battleMode.myCharacter || !battleMode.opponent) return;

    setBattleMode(prev => ({ ...prev, isBattling: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/battles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          attackerId: battleMode.myCharacter.id,
          defenderId: battleMode.opponent.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setBattleMode(prev => ({
          ...prev,
          result: data.data,
          isBattling: false
        }));

        // 캐릭터 정보 업데이트
        const updatedCharacters = myCharacters.map(char => {
          if (char.id === battleMode.myCharacter!.id) {
            return {
              ...char,
              activeBattlesToday: char.activeBattlesToday + 1,
              wins: char.wins + (data.data.result.winner === 'attacker' ? 1 : 0),
              losses: char.losses + (data.data.result.winner === 'defender' ? 1 : 0),
              baseScore: data.data.updatedStats.attacker.baseScore,
              eloScore: data.data.updatedStats.attacker.eloScore
            };
          }
          return char;
        });
        setMyCharacters(updatedCharacters);

        // 리더보드 새로고침
        setTimeout(() => {
          fetchLeaderboard();
        }, 2000);
      } else {
        alert(data.error || '배틀 중 오류가 발생했어요');
        setBattleMode(prev => ({ ...prev, isBattling: false }));
      }
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

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <h1 className="text-5xl font-bold text-purple-600 mb-2">
            🏆 명예의 전당 🏆
          </h1>
          <p className="text-xl text-gray-700">
            최강의 동물 전사는 누구일까요?
          </p>
          {user && (
            <p className="text-sm text-gray-600 mt-2">
              로그인: {user.displayName || user.email || '플레이어'}
            </p>
          )}
        </header>

        {/* 필터 옵션 */}
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
                onChange={(e) => setSortBy(e.target.value as 'score' | 'elo')}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500"
              >
                <option value="elo">🎯 실력 점수</option>
                <option value="score">📊 기본 점수</option>
              </select>
            </div>
          </div>
        </div>

        {/* 리더보드 테이블 */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⏳</div>
            <p className="text-xl">순위를 불러오는 중...</p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">순위</th>
                    <th className="px-4 py-3 text-left">캐릭터</th>
                    <th className="px-4 py-3 text-left">동물</th>
                    <th className="px-4 py-3 text-center">점수</th>
                    <th className="px-4 py-3 text-center">승률</th>
                    <th className="px-4 py-3 text-center">전적</th>
                    <th className="px-4 py-3 text-center">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr 
                      key={entry.id} 
                      className={`border-b-2 ${getRankColor(entry.rank)} hover:bg-opacity-70 transition-colors`}
                    >
                      <td className="px-4 py-4">
                        <div className="text-2xl font-bold">
                          {getRankEmoji(entry.rank)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-lg">
                          {entry.characterName}
                          {entry.isBot && (
                            <span className="ml-2 text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                              🤖 AI
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {entry.playerName || '익명의 전사'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{entry.animalIcon}</span>
                          <span>{entry.animalName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="font-bold text-lg">
                          {sortBy === 'score' ? entry.baseScore : entry.eloScore}
                        </div>
                        <div className="text-sm text-gray-600">
                          {sortBy === 'score' ? `ELO: ${entry.eloScore}` : `기본: ${entry.baseScore}`}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="font-bold text-lg">
                          {entry.winRate}%
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="text-sm">
                          <span className="text-green-600 font-bold">{entry.wins}승</span>
                          {' / '}
                          <span className="text-red-600 font-bold">{entry.losses}패</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          총 {entry.totalBattles}전
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {isMyCharacter(entry.id) ? (
                          <span className="text-sm text-gray-500">내 캐릭터</span>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => startBattle(entry)}
                              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              ⚔️ 도전!
                            </motion.button>
                            {entry.isBot && (
                              <span className="text-xs text-purple-600">무제한</span>
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
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="/play"
            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200"
          >
            🎮 게임으로 돌아가기
          </a>
          {!user && (
            <a
              href="/"
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-colors duration-200"
            >
              🔑 로그인하기
            </a>
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
                  disabled={!selectedOpponent?.isBot && character.activeBattlesToday >= 10}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    !selectedOpponent?.isBot && character.activeBattlesToday >= 10
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
                          {character.animal?.koreanName} | ELO: {character.eloScore}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        오늘 배틀: {character.activeBattlesToday}/10
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
              <>
                <h2 className="text-3xl font-bold text-center mb-6">⚔️ 배틀 준비!</h2>
                
                <div className="flex justify-between items-center mb-8">
                  <div className="text-center">
                    <div className="text-6xl mb-2">{battleMode.myCharacter?.animal?.emoji || '🐾'}</div>
                    <h3 className="text-xl font-bold">{battleMode.myCharacter?.characterName}</h3>
                    <p className="text-sm text-gray-600">나의 캐릭터</p>
                  </div>
                  
                  <div className="text-4xl animate-pulse">VS</div>
                  
                  <div className="text-center">
                    <div className="text-6xl mb-2">{battleMode.opponent?.animalIcon || '🐾'}</div>
                    <h3 className="text-xl font-bold">{battleMode.opponent?.characterName}</h3>
                    <p className="text-sm text-gray-600">상대 캐릭터</p>
                  </div>
                </div>

                <div className="text-center">
                  <button
                    onClick={executeBattle}
                    disabled={battleMode.isBattling}
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 px-8 rounded-xl text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {battleMode.isBattling ? '배틀 중... ⚔️' : '배틀 시작! 🔥'}
                  </button>
                </div>

                <button
                  onClick={closeBattleMode}
                  className="mt-6 w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded-lg"
                >
                  취소
                </button>
              </>
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
                      <p className={`text-2xl font-bold ${
                        battleMode.result.result.attackerScoreChange > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {battleMode.result.result.attackerScoreChange > 0 ? '+' : ''}
                        {battleMode.result.result.attackerScoreChange}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">ELO 변화</p>
                      <p className={`text-2xl font-bold ${
                        battleMode.result.result.attackerEloChange > 0 ? 'text-green-600' : 'text-red-600'
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
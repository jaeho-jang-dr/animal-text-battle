'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

interface BattleLog {
  id: string;
  attackerId: string;
  defenderId: string;
  winnerId: string;
  attackerName: string;
  defenderName: string;
  attackerEmoji: string;
  defenderEmoji: string;
  attackerBattleText: string;
  defenderBattleText: string;
  aiJudgment: string;
  aiReasoning: string;
  attackerScoreChange: number;
  defenderScoreChange: number;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BattleStats {
  todayBattles: number;
  totalBattles: number;
}

export default function BattlesTab() {
  const { firebaseUser } = useAuth();
  const [battles, setBattles] = useState<BattleLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [stats, setStats] = useState<BattleStats>({ todayBattles: 0, totalBattles: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBattle, setSelectedBattle] = useState<BattleLog | null>(null);

  useEffect(() => {
    fetchBattles();
  }, [firebaseUser, pagination.page]);

  const getAuthHeaders = async () => {
    if (!firebaseUser) return {};
    const token = await firebaseUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  };

  const fetchBattles = async () => {
    try {
      setIsLoading(true);
      const headers = await getAuthHeaders();

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/admin/battle-logs?${params}`, { headers });
      const data = await response.json();

      if (data.success) {
        setBattles(data.data.logs || []);
        setPagination((prev) => ({
          ...prev,
          ...data.data.pagination,
        }));
        setStats(data.data.stats || { todayBattles: 0, totalBattles: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch battles:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchBattles();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getScoreChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="text-4xl mb-2">⚔️</div>
          <div className="text-3xl font-bold text-purple-600">{stats.todayBattles}</div>
          <div className="text-gray-600">오늘 배틀 수</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="text-4xl mb-2">📊</div>
          <div className="text-3xl font-bold text-blue-600">{stats.totalBattles}</div>
          <div className="text-gray-600">전체 배틀 수</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <div className="text-4xl mb-2">📄</div>
          <div className="text-3xl font-bold text-green-600">{pagination.totalPages}</div>
          <div className="text-gray-600">총 페이지</div>
        </motion.div>
      </div>

      {/* 필터 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <h3 className="text-lg font-bold mb-4">🔍 배틀 검색</h3>
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold transition-colors"
            >
              검색
            </button>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setDateFrom('');
                setDateTo('');
                setPagination((prev) => ({ ...prev, page: 1 }));
                fetchBattles();
              }}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold transition-colors"
            >
              초기화
            </button>
          </div>
        </form>
      </motion.div>

      {/* 배틀 목록 */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-bold">📜 배틀 기록</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin text-4xl mb-4">⚔️</div>
            <p className="text-gray-600">배틀 기록을 불러오는 중...</p>
          </div>
        ) : battles.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <div className="text-4xl mb-4">📭</div>
            <p>배틀 기록이 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">시간</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">공격자</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">VS</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">방어자</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">결과</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">상세</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {battles.map((battle, index) => (
                  <motion.tr
                    key={battle.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(battle.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{battle.attackerEmoji}</span>
                        <div>
                          <div className="font-medium text-gray-900">{battle.attackerName}</div>
                          <div className={`text-sm ${getScoreChangeColor(battle.attackerScoreChange)}`}>
                            {battle.attackerScoreChange > 0 ? '+' : ''}
                            {battle.attackerScoreChange}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-400">⚔️</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{battle.defenderEmoji}</span>
                        <div>
                          <div className="font-medium text-gray-900">{battle.defenderName}</div>
                          <div className={`text-sm ${getScoreChangeColor(battle.defenderScoreChange)}`}>
                            {battle.defenderScoreChange > 0 ? '+' : ''}
                            {battle.defenderScoreChange}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {battle.winnerId === battle.attackerId ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">
                          공격자 승
                        </span>
                      ) : battle.winnerId === battle.defenderId ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                          방어자 승
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">
                          무승부
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedBattle(battle)}
                        className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-bold transition-colors"
                      >
                        상세
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-600">
              총 {pagination.total}개 중 {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(pagination.page * pagination.limit, pagination.total)}개
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page <= 1}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>
              <span className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-bold">
                {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* 배틀 상세 모달 */}
      <AnimatePresence>
        {selectedBattle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b sticky top-0 bg-white rounded-t-3xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">⚔️ 배틀 상세</h3>
                  <button
                    onClick={() => setSelectedBattle(null)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* 대결 정보 */}
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="text-5xl mb-2">{selectedBattle.attackerEmoji}</div>
                    <div className="font-bold">{selectedBattle.attackerName}</div>
                    <div className={`text-sm ${getScoreChangeColor(selectedBattle.attackerScoreChange)}`}>
                      {selectedBattle.attackerScoreChange > 0 ? '+' : ''}
                      {selectedBattle.attackerScoreChange}점
                    </div>
                  </div>
                  <div className="text-4xl text-gray-400">⚔️</div>
                  <div className="text-center">
                    <div className="text-5xl mb-2">{selectedBattle.defenderEmoji}</div>
                    <div className="font-bold">{selectedBattle.defenderName}</div>
                    <div className={`text-sm ${getScoreChangeColor(selectedBattle.defenderScoreChange)}`}>
                      {selectedBattle.defenderScoreChange > 0 ? '+' : ''}
                      {selectedBattle.defenderScoreChange}점
                    </div>
                  </div>
                </div>

                {/* 배틀 텍스트 */}
                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-xl">
                    <div className="text-sm font-bold text-red-600 mb-2">공격자 대사</div>
                    <p className="text-gray-800">{selectedBattle.attackerBattleText || '(대사 없음)'}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <div className="text-sm font-bold text-blue-600 mb-2">방어자 대사</div>
                    <p className="text-gray-800">{selectedBattle.defenderBattleText || '(대사 없음)'}</p>
                  </div>
                </div>

                {/* AI 판정 */}
                {selectedBattle.aiJudgment && (
                  <div className="bg-purple-50 p-4 rounded-xl">
                    <div className="text-sm font-bold text-purple-600 mb-2">🤖 AI 판정</div>
                    <p className="text-gray-800">{selectedBattle.aiJudgment}</p>
                    {selectedBattle.aiReasoning && (
                      <p className="text-sm text-gray-600 mt-2 italic">{selectedBattle.aiReasoning}</p>
                    )}
                  </div>
                )}

                {/* 시간 정보 */}
                <div className="text-center text-sm text-gray-500">
                  {formatDate(selectedBattle.createdAt)}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

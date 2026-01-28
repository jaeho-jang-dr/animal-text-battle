'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

interface AdminLog {
  id: string;
  action: string;
  admin_email: string;
  target_user_id?: string;
  details?: string;
  created_at: string;
}

interface WarningLog {
  id: string;
  type: string;
  action: string;
  user_name: string;
  user_id: string;
  content: string;
  issued_by: string;
  created_at: string;
}

interface BattleLog {
  id: string;
  type: string;
  attacker: string;
  defender: string;
  winner: string;
  created_at: string;
}

interface RecentUser {
  id: string;
  type: string;
  display_name: string;
  email: string;
  is_guest: boolean;
  created_at: string;
}

interface LogStats {
  totalAdminLogs: number;
  totalWarnings: number;
  todayWarnings: number;
  todayBattles: number;
}

export default function LogsTab() {
  const { firebaseUser } = useAuth();
  const [adminLogs, setAdminLogs] = useState<AdminLog[]>([]);
  const [warningLogs, setWarningLogs] = useState<WarningLog[]>([]);
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([]);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'admin' | 'warning' | 'battle' | 'users'>('warning');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [firebaseUser, dateFrom, dateTo]);

  const getAuthHeaders = async () => {
    if (!firebaseUser) return {};
    const token = await firebaseUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  };

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const response = await fetch(`/api/admin/logs?${params}`, { headers });
      const data = await response.json();

      if (data.success) {
        setAdminLogs(data.data.logs || []);
        setWarningLogs(data.data.warningLogs || []);
        setBattleLogs(data.data.battleLogs || []);
        setRecentUsers(data.data.recentUsers || []);
        setStats(data.data.stats || null);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionLabel = (action: string) => {
    const labels: { [key: string]: string } = {
      warning_issued: '⚠️ 경고 발송',
      user_suspended: '⛔ 사용자 정지',
      user_unsuspended: '✅ 정지 해제',
      setting_changed: '⚙️ 설정 변경',
      maintenance_on: '🚧 점검 모드 시작',
      maintenance_off: '✅ 점검 모드 종료',
    };
    return labels[action] || action;
  };

  const getWarningTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      profanity: '🤬 욕설',
      inappropriate_content: '⚠️ 부적절한 내용',
      spam: '📢 도배',
      harassment: '😠 괴롭힘',
      manual_warning: '✋ 수동 경고',
      other: '❓ 기타',
    };
    return labels[type] || type;
  };

  const tabs = [
    { id: 'warning', label: '⚠️ 경고 로그', count: warningLogs.length },
    { id: 'battle', label: '⚔️ 배틀 로그', count: battleLogs.length },
    { id: 'users', label: '👥 신규 가입', count: recentUsers.length },
    { id: 'admin', label: '👮 관리자 활동', count: adminLogs.length },
  ];

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-lg p-4 text-center"
          >
            <div className="text-3xl font-bold text-orange-500">{stats.todayWarnings}</div>
            <div className="text-sm text-gray-600">오늘 경고</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg p-4 text-center"
          >
            <div className="text-3xl font-bold text-purple-500">{stats.todayBattles}</div>
            <div className="text-sm text-gray-600">오늘 배틀</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-lg p-4 text-center"
          >
            <div className="text-3xl font-bold text-red-500">{stats.totalWarnings}</div>
            <div className="text-sm text-gray-600">총 경고</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-lg p-4 text-center"
          >
            <div className="text-3xl font-bold text-blue-500">{stats.totalAdminLogs}</div>
            <div className="text-sm text-gray-600">관리자 활동</div>
          </motion.div>
        </div>
      )}

      {/* 날짜 필터 */}
      <div className="bg-white p-4 rounded-xl shadow-sm flex flex-wrap gap-4 items-center">
        <span className="text-gray-600 font-medium">📅 기간 필터:</span>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <span className="text-gray-400">~</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={() => {
            setDateFrom('');
            setDateTo('');
          }}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600"
        >
          초기화
        </button>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-4 py-3 text-center font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 hover:bg-purple-50'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* 로그 내용 */}
        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin text-4xl mb-4">🔄</div>
              <p className="text-gray-500">로그를 불러오는 중...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* 경고 로그 */}
              {activeTab === 'warning' && (
                <motion.div
                  key="warning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 max-h-[500px] overflow-y-auto"
                >
                  {warningLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">경고 기록이 없습니다.</div>
                  ) : (
                    warningLogs.map((log) => (
                      <div key={log.id} className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-orange-700">{getWarningTypeLabel(log.action)}</span>
                          <span className="text-xs text-gray-500">{formatDate(log.created_at)}</span>
                        </div>
                        <div className="text-sm text-gray-700 mb-1">
                          <span className="font-medium">{log.user_name}</span>
                        </div>
                        <div className="text-sm text-gray-600 bg-white p-2 rounded">
                          "{log.content}"
                        </div>
                        <div className="text-xs text-gray-400 mt-2">발송: {log.issued_by}</div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {/* 배틀 로그 */}
              {activeTab === 'battle' && (
                <motion.div
                  key="battle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 max-h-[500px] overflow-y-auto"
                >
                  {battleLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">배틀 기록이 없습니다.</div>
                  ) : (
                    battleLogs.map((log) => (
                      <div key={log.id} className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className={`font-bold ${log.winner === 'attacker' ? 'text-green-600' : 'text-gray-600'}`}>
                              {log.attacker}
                            </span>
                            <span className="text-purple-500 font-bold">⚔️ VS</span>
                            <span className={`font-bold ${log.winner === 'defender' ? 'text-green-600' : 'text-gray-600'}`}>
                              {log.defender}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{formatDate(log.created_at)}</span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          🏆 승자: <span className="font-bold text-green-600">
                            {log.winner === 'attacker' ? log.attacker : log.defender}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {/* 신규 가입 */}
              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 max-h-[500px] overflow-y-auto"
                >
                  {recentUsers.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">최근 가입자가 없습니다.</div>
                  ) : (
                    recentUsers.map((user) => (
                      <div key={user.id} className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              user.is_guest ? 'bg-gray-400' : 'bg-blue-500'
                            }`}>
                              {user.is_guest ? 'G' : user.display_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-gray-800">{user.display_name}</div>
                              <div className="text-xs text-gray-500">
                                {user.email || '게스트 계정'}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              user.is_guest ? 'bg-gray-200 text-gray-600' : 'bg-blue-200 text-blue-700'
                            }`}>
                              {user.is_guest ? '게스트' : '가입 회원'}
                            </span>
                            <div className="text-xs text-gray-500 mt-1">{formatDate(user.created_at)}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {/* 관리자 활동 */}
              {activeTab === 'admin' && (
                <motion.div
                  key="admin"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3 max-h-[500px] overflow-y-auto"
                >
                  {adminLogs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">관리자 활동 기록이 없습니다.</div>
                  ) : (
                    adminLogs.map((log) => (
                      <div key={log.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-gray-700">{getActionLabel(log.action)}</span>
                          <span className="text-xs text-gray-500">{formatDate(log.created_at)}</span>
                        </div>
                        {log.details && (
                          <div className="text-sm text-gray-600 bg-white p-2 rounded mb-2">
                            {log.details}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          관리자: {log.admin_email}
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

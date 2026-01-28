'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

interface AdminUser {
  id: string;
  email: string;
  display_name: string;
  is_guest: number;
  is_suspended: number;
  warning_count: number;
  created_at: string;
  character_count: number;
  highest_score: number;
  last_login?: string;
}

export default function UsersTab() {
  const { firebaseUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showUserDetailModal, setShowUserDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [warningReason, setWarningReason] = useState('');
  const [warningType, setWarningType] = useState('inappropriate_content');

  useEffect(() => {
    fetchUsers();
  }, [firebaseUser, filter]);

  const getAuthHeaders = async () => {
    if (!firebaseUser) return {};
    const token = await firebaseUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  };

  const fetchUsers = async (query = '') => {
    try {
      setIsLoading(true);
      const headers = await getAuthHeaders();
      const params = new URLSearchParams({
        q: query || searchTerm,
        limit: '100',
        filter,
      });
      const response = await fetch(`/api/admin/users/search?${params}`, { headers });
      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchTerm);
  };

  const openWarningModal = (user: AdminUser) => {
    setSelectedUser(user);
    setWarningReason('');
    setWarningType('inappropriate_content');
    setShowWarningModal(true);
  };

  const openUserDetailModal = (user: AdminUser) => {
    setSelectedUser(user);
    setShowUserDetailModal(true);
  };

  const submitWarning = async () => {
    if (!selectedUser || !warningReason) return;

    if (
      !confirm(
        `${selectedUser.display_name}님에게 경고를 보내시겠습니까? (현재 경고: ${selectedUser.warning_count}회)\n3회 누적 시 자동 정지됩니다.`
      )
    ) {
      return;
    }

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/warnings', {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          reason: warningReason,
          warningType,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(
          data.data.autoSuspended
            ? '⚠️ 경고 3회 누적으로 사용자가 자동 정지되었습니다.'
            : '✅ 경고가 발송되었습니다.'
        );
        setShowWarningModal(false);
        fetchUsers(searchTerm);
      } else {
        alert(data.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Warning submission error:', error);
      alert('경고 발송 중 오류가 발생했습니다.');
    }
  };

  const handleUnsuspend = async (user: AdminUser) => {
    if (!confirm(`${user.display_name}님의 정지를 해제하시겠습니까?`)) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/warnings', {
        method: 'DELETE',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'unsuspend',
          userId: user.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert('✅ 정지가 해제되었습니다.');
        fetchUsers(searchTerm);
      } else {
        alert(data.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Unsuspend error:', error);
      alert('정지 해제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 통계 계산
  const stats = {
    total: users.length,
    suspended: users.filter((u) => u.is_suspended).length,
    warned: users.filter((u) => u.warning_count > 0).length,
    guests: users.filter((u) => u.is_guest).length,
  };

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-4 text-center"
        >
          <div className="text-3xl font-bold text-purple-600">{stats.total}</div>
          <div className="text-sm text-gray-600">전체 사용자</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-lg p-4 text-center"
        >
          <div className="text-3xl font-bold text-red-500">{stats.suspended}</div>
          <div className="text-sm text-gray-600">정지된 사용자</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-lg p-4 text-center"
        >
          <div className="text-3xl font-bold text-orange-500">{stats.warned}</div>
          <div className="text-sm text-gray-600">경고 받은 사용자</div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-lg p-4 text-center"
        >
          <div className="text-3xl font-bold text-gray-500">{stats.guests}</div>
          <div className="text-sm text-gray-600">게스트 사용자</div>
        </motion.div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white p-4 rounded-xl shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="사용자 검색 (이메일, 닉네임, ID)"
            className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
          >
            <option value="all">전체</option>
            <option value="suspended">정지된 사용자</option>
            <option value="warned">경고 받은 사용자</option>
            <option value="guest">게스트</option>
          </select>
          <button
            type="submit"
            className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700"
          >
            🔍 검색
          </button>
        </form>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="animate-spin text-4xl mb-4">🔄</div>
            불러오는 중...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    캐릭터
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    최고 점수
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태/경고
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    가입일
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-purple-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div
                          className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${
                            user.is_suspended
                              ? 'bg-red-500'
                              : user.is_guest
                                ? 'bg-gray-400'
                                : 'bg-purple-500'
                          }`}
                        >
                          {user.is_suspended ? '⛔' : user.is_guest ? 'G' : user.display_name?.charAt(0) || 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-bold text-gray-900">{user.display_name}</div>
                          <div className="text-xs text-gray-500">
                            {user.email ? user.email.substring(0, 20) + (user.email.length > 20 ? '...' : '') : user.is_guest ? '게스트 계정' : '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">{user.character_count}마리</td>
                    <td className="px-6 py-4 text-center text-sm font-bold text-gray-700">
                      {user.highest_score || 0}점
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {user.is_suspended ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                            정지됨 ⛔
                          </span>
                        ) : (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            활동중 ✅
                          </span>
                        )}
                        <span
                          className={`text-xs font-bold ${user.warning_count > 0 ? 'text-red-500' : 'text-gray-400'}`}
                        >
                          경고: {user.warning_count}회
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-gray-500">{formatDate(user.created_at)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => openUserDetailModal(user)}
                          className="text-blue-500 hover:text-blue-700 font-bold text-xs"
                        >
                          상세보기
                        </button>
                        {user.is_suspended ? (
                          <button
                            onClick={() => handleUnsuspend(user)}
                            className="text-green-500 hover:text-green-700 font-bold text-xs"
                          >
                            정지해제
                          </button>
                        ) : (
                          <button
                            onClick={() => openWarningModal(user)}
                            className="text-orange-500 hover:text-orange-700 font-bold text-xs"
                          >
                            ⚠️ 경고
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                      검색된 사용자가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 경고 모달 */}
      {showWarningModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="text-xl font-bold">경고 발송</h3>
              <p className="text-gray-600 mt-1">
                <span className="font-bold text-purple-600">{selectedUser.display_name}</span>님에게 경고를 보냅니다.
              </p>
              <p className="text-red-500 text-sm mt-2 font-bold bg-red-50 p-2 rounded">
                현재 경고 누적: {selectedUser.warning_count}회
                <br />
                (3회 누적 시 자동 정지됩니다)
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700 mb-2">경고 유형</label>
              <select
                value={warningType}
                onChange={(e) => setWarningType(e.target.value)}
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none"
              >
                <option value="inappropriate_content">부적절한 내용</option>
                <option value="profanity">욕설/비속어</option>
                <option value="spam">도배/스팸</option>
                <option value="harassment">괴롭힘</option>
                <option value="other">기타</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">경고 사유</label>
              <textarea
                value={warningReason}
                onChange={(e) => setWarningReason(e.target.value)}
                className="w-full border rounded-lg p-3 h-32 focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                placeholder="예: 부적절한 언어 사용, 도배 등"
              ></textarea>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowWarningModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
              >
                취소
              </button>
              <button
                onClick={submitWarning}
                disabled={!warningReason}
                className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl shadow-lg transition-colors"
              >
                🚨 경고 발송
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* 사용자 상세 모달 */}
      {showUserDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
          >
            <div className="text-center mb-6">
              <div
                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl text-white ${
                  selectedUser.is_suspended ? 'bg-red-500' : 'bg-purple-500'
                }`}
              >
                {selectedUser.is_suspended ? '⛔' : selectedUser.display_name?.charAt(0) || 'U'}
              </div>
              <h3 className="text-xl font-bold mt-3">{selectedUser.display_name}</h3>
              <p className="text-gray-500 text-sm">{selectedUser.email || '게스트 계정'}</p>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">사용자 ID</span>
                <span className="font-mono text-sm">{selectedUser.id.substring(0, 20)}...</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">계정 유형</span>
                <span>{selectedUser.is_guest ? '게스트' : '가입 회원'}</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">캐릭터 수</span>
                <span className="font-bold">{selectedUser.character_count}마리</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">최고 점수</span>
                <span className="font-bold text-purple-600">{selectedUser.highest_score}점</span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">경고 횟수</span>
                <span className={`font-bold ${selectedUser.warning_count > 0 ? 'text-red-500' : 'text-gray-500'}`}>
                  {selectedUser.warning_count}회
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">상태</span>
                <span className={selectedUser.is_suspended ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
                  {selectedUser.is_suspended ? '정지됨' : '활동중'}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-600">가입일</span>
                <span>{formatDate(selectedUser.created_at)}</span>
              </div>
            </div>

            <button
              onClick={() => setShowUserDetailModal(false)}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              닫기
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

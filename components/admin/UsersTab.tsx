'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
}

export default function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [warningReason, setWarningReason] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (query = '') => {
    try {
      setIsLoading(true);
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/users/search?q=${query}&limit=50`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
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
    setShowWarningModal(true);
  };

  const submitWarning = async () => {
    if (!selectedUser || !warningReason) return;

    if (!confirm(`${selectedUser.display_name}님에게 경고를 보내시겠습니까? (현재 경고: ${selectedUser.warning_count}회)\n3회 누적 시 자동 정지됩니다.`)) {
      return;
    }

    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/warnings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          reason: warningReason,
          warningType: 'manual_warning'
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(data.data.autoSuspended ? '⚠️ 경고 3회 누적으로 사용자가 자동 정지되었습니다.' : '✅ 경고가 발송되었습니다.');
        setShowWarningModal(false);
        fetchUsers(searchTerm); //리스트 새로고침
      } else {
        alert(data.error || '오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Warning submission error:', error);
      alert('경고 발송 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 검색 바 */}
      <div className="bg-white p-4 rounded-xl shadow-sm flex gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="사용자 검색 (이메일, 닉네임, ID)"
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-purple-500"
          />
          <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-700">
            검색
          </button>
        </form>
      </div>

      {/* 사용자 목록 */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">불러오는 중...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">사용자</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">캐릭터</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">최고 점수</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">상태/경고</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-purple-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">
                        {user.is_guest ? 'G' : 'U'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-bold text-gray-900">{user.display_name}</div>
                        <div className="text-sm text-gray-500">{user.email || (user.is_guest ? 'Guest User' : '-')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-500">
                    {user.character_count}마리
                  </td>
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
                      <span className={`text-xs font-bold ${user.warning_count > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                        경고: {user.warning_count}회
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {!user.is_suspended && (
                      <button
                        onClick={() => openWarningModal(user)}
                        className="text-orange-500 hover:text-orange-700 font-bold text-sm border border-orange-200 rounded px-3 py-1 hover:bg-orange-50"
                      >
                        ⚠️ 경고주기
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    검색된 사용자가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
                현재 경고 누적: {selectedUser.warning_count}회<br />
                (3회 누적 시 자동 정지됩니다)
              </p>
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
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl shadow-lg transition-colors"
              >
                🚨 경고 발송
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
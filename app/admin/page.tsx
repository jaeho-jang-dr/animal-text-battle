'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { safeJsonParse } from '../../lib/utils/json-utils';
import StatsTab, { AdminStats } from '../../components/admin/StatsTab';
import UsersTab from '../../components/admin/UsersTab';
import BattlesTab from '../../components/admin/BattlesTab';
import LogsTab from '../../components/admin/LogsTab';
import SettingsTab from '../../components/admin/SettingsTab';
import NpcsTab from '../../components/admin/NpcsTab';

import { useAuth } from '../../contexts/AuthContext';

// Hardcoded Admin List (Source of Truth)
const ADMIN_EMAILS = ['drjang000@gmail.com', 'drjang00@gmail.com', '102030hohoho@gmail.com'];

interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  permissions: string;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'battles' | 'settings' | 'logs' | 'npcs'>('stats');
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    if (authLoading) return;

    // Check Authorization
    if (!user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
      // Not an admin, redirect
      alert('관리자 권한이 없습니다! 🚫');
      router.push('/');
    } else {
      // Is Admin
      fetchStats();
    }
  }, [user, authLoading, router]);

  const fetchStats = async () => {
    try {
      // Mock stats for now or client-side calculation
      /*
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
      */
    } catch (error) {
      console.error('Stats fetch error:', error);
    }
  };

  if (authLoading || !user || !user.email || !ADMIN_EMAILS.includes(user.email)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin text-4xl">🦄</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
      {/* 헤더 */}
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="text-4xl"
            >
              🦄
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold">관리자 대시보드</h1>
              <p className="text-purple-200">Kid Text Battle 관리 시스템</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm">
              {user?.displayName || user?.email}
            </span>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-500 hover:bg-red-600 px-4 py-2 rounded-lg transition-colors"
            >
              🏠 메인으로
            </button>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <div className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex">
            {['stats', 'users', 'npcs', 'battles', 'logs', 'settings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`flex-1 py-4 px-6 font-bold transition-all ${activeTab === tab
                  ? 'bg-purple-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-purple-100'
                  }`}
              >
                {tab === 'stats' && '📊 통계'}
                {tab === 'users' && '👥 사용자'}
                {tab === 'npcs' && '🤖 NPC 부대'}
                {tab === 'battles' && '⚔️ 배틀'}
                {tab === 'logs' && '📜 로그'}
                {tab === 'settings' && '⚙️ 설정'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="max-w-7xl mx-auto p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'stats' && (
            <StatsTab stats={stats} />
          )}

          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <UsersTab />
            </motion.div>
          )}

          {activeTab === 'npcs' && (
            <motion.div
              key="npcs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <NpcsTab />
            </motion.div>
          )}

          {activeTab === 'battles' && (
            <motion.div
              key="battles"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <BattlesTab />
            </motion.div>
          )}

          {activeTab === 'logs' && (
            <motion.div
              key="logs"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <LogsTab />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SettingsTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 플로팅 액션 버튼들 */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push('/leaderboard')}
          className="bg-purple-500 hover:bg-purple-600 text-white rounded-full p-4 shadow-lg"
        >
          🏆
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push('/play')}
          className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg"
        >
          🎮
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push('/')}
          className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-lg"
        >
          🏠
        </motion.button>
      </div>
    </main>
  );
}
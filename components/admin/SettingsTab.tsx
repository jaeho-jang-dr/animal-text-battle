'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
}

interface LockedUser {
  id: string;
  email: string;
  display_name: string;
  warning_count: number;
  is_suspended: boolean;
  locked_at: string;
}

export default function SettingsTab() {
  const { firebaseUser } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [lockedUsers, setLockedUsers] = useState<LockedUser[]>([]);
  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [firebaseUser]);

  const getAuthHeaders = async () => {
    if (!firebaseUser) return {};
    const token = await firebaseUser.getIdToken();
    return { Authorization: `Bearer ${token}` };
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/settings', { headers });
      const data = await response.json();
      if (data.success) {
        setSettings(data.data.settings || []);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });
      const data = await response.json();
      if (data.success) {
        fetchSettings();
        setEditingKey(null);
        setSaveSuccess(key);
        setTimeout(() => setSaveSuccess(null), 3000);
      } else {
        alert('설정 저장 실패: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to update setting:', error);
      alert('설정 저장 중 오류가 발생했습니다.');
    }
  };

  const toggleMaintenance = async (enable: boolean) => {
    setIsMaintenanceLoading(true);
    try {
      await updateSetting('maintenance_mode', String(enable));
      if (enable) {
        alert('🚧 점검 모드가 활성화되었습니다.\n일반 사용자는 접근할 수 없습니다.');
      } else {
        alert('✅ 점검 모드가 해제되었습니다.');
      }
    } finally {
      setIsMaintenanceLoading(false);
    }
  };

  const getSettingLabel = (key: string) => {
    const labels: { [key: string]: string } = {
      daily_battle_limit: '🎮 일일 배틀 횟수 제한',
      profanity_filter_enabled: '🚫 비속어 필터 활성화',
      auto_lock_on_violation: '🔒 비속어 사용 시 자동 잠금',
      max_warnings_before_lock: '⚠️ 잠금 전 최대 경고 횟수',
      maintenance_mode: '🚧 점검 모드',
      maintenance_message: '📝 점검 메시지',
      bot_battle_enabled: '🤖 봇 배틀 활성화',
      max_characters_per_user: '👤 사용자당 최대 캐릭터 수',
    };
    return labels[key] || key;
  };

  const getSettingDescription = (key: string) => {
    const descriptions: { [key: string]: string } = {
      daily_battle_limit: '하루에 한 캐릭터가 시작할 수 있는 최대 배틀 수입니다.',
      profanity_filter_enabled: '배틀 텍스트에서 비속어를 자동으로 감지합니다.',
      auto_lock_on_violation: '비속어 사용 시 해당 계정을 자동으로 잠금 처리합니다.',
      max_warnings_before_lock: '이 횟수만큼 경고를 받으면 계정이 자동으로 잠깁니다.',
      maintenance_mode: '활성화 시 관리자 외 모든 사용자의 접근을 차단합니다.',
      maintenance_message: '점검 모드 시 사용자에게 표시되는 메시지입니다.',
      bot_battle_enabled: 'NPC 봇과의 배틀을 허용합니다.',
      max_characters_per_user: '한 사용자가 만들 수 있는 최대 캐릭터 수입니다.',
    };
    return descriptions[key] || '';
  };

  const getSettingCategory = (key: string): 'battle' | 'safety' | 'system' => {
    if (['daily_battle_limit', 'bot_battle_enabled'].includes(key)) return 'battle';
    if (['profanity_filter_enabled', 'auto_lock_on_violation', 'max_warnings_before_lock'].includes(key))
      return 'safety';
    return 'system';
  };

  const isMaintenanceEnabled = settings.find((s) => s.setting_key === 'maintenance_mode')?.setting_value === 'true';

  const battleSettings = settings.filter((s) => getSettingCategory(s.setting_key) === 'battle');
  const safetySettings = settings.filter((s) => getSettingCategory(s.setting_key) === 'safety');
  const systemSettings = settings.filter((s) => getSettingCategory(s.setting_key) === 'system');

  const renderSettingCard = (setting: Setting, index: number) => {
    const isBooleanSetting =
      setting.setting_key.includes('enabled') ||
      setting.setting_key.includes('mode') ||
      setting.setting_key === 'auto_lock_on_violation';
    const isTextSetting = setting.setting_key === 'maintenance_message';

    return (
      <motion.div
        key={setting.setting_key}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">{getSettingLabel(setting.setting_key)}</h3>
            <p className="text-sm text-gray-600 mb-3">{getSettingDescription(setting.setting_key)}</p>

            {editingKey === setting.setting_key ? (
              <div className="flex gap-2 flex-wrap">
                {isBooleanSetting ? (
                  <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="true">활성화</option>
                    <option value="false">비활성화</option>
                  </select>
                ) : isTextSetting ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                    placeholder="점검 메시지 입력"
                  />
                ) : (
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                    min="1"
                  />
                )}
                <button
                  onClick={() => updateSetting(setting.setting_key, editValue)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors"
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingKey(null)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold text-sm transition-colors"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <span
                  className={`font-mono px-3 py-1 rounded-lg ${
                    isBooleanSetting
                      ? setting.setting_value === 'true'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                      : 'bg-purple-100 text-purple-700'
                  }`}
                >
                  {isBooleanSetting
                    ? setting.setting_value === 'true'
                      ? '✅ 활성화'
                      : '⭕ 비활성화'
                    : setting.setting_value}
                </span>
                <button
                  onClick={() => {
                    setEditingKey(setting.setting_key);
                    setEditValue(setting.setting_value);
                  }}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-bold text-sm transition-colors"
                >
                  수정
                </button>
              </div>
            )}
          </div>
        </div>

        {saveSuccess === setting.setting_key && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-2 bg-green-100 text-green-700 rounded-lg text-sm"
          >
            ✅ 설정이 저장되었습니다!
          </motion.div>
        )}
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-gray-600">설정을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 긴급 점검 모드 배너 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`rounded-3xl shadow-xl p-6 ${isMaintenanceEnabled ? 'bg-red-500 text-white' : 'bg-white'}`}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🚧 {isMaintenanceEnabled ? '점검 모드 활성화됨' : '점검 모드'}
            </h2>
            <p className={isMaintenanceEnabled ? 'text-red-100' : 'text-gray-600'}>
              {isMaintenanceEnabled
                ? '현재 일반 사용자는 앱에 접근할 수 없습니다.'
                : '긴급 상황 시 앱 전체를 점검 모드로 전환합니다.'}
            </p>
          </div>
          <button
            onClick={() => toggleMaintenance(!isMaintenanceEnabled)}
            disabled={isMaintenanceLoading}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              isMaintenanceEnabled
                ? 'bg-white text-red-600 hover:bg-red-50'
                : 'bg-red-500 text-white hover:bg-red-600'
            } ${isMaintenanceLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isMaintenanceLoading ? '처리 중...' : isMaintenanceEnabled ? '점검 해제' : '🚨 긴급 점검 시작'}
          </button>
        </div>
      </motion.div>

      {/* 배틀 설정 */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">배틀</span>
          배틀 관련 설정
        </h3>
        <div className="grid gap-4">{battleSettings.map((s, i) => renderSettingCard(s, i))}</div>
      </div>

      {/* 안전 설정 */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm">안전</span>
          콘텐츠 안전 설정
        </h3>
        <div className="grid gap-4">{safetySettings.map((s, i) => renderSettingCard(s, i))}</div>
      </div>

      {/* 시스템 설정 */}
      <div>
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-sm">시스템</span>
          시스템 설정
        </h3>
        <div className="grid gap-4">{systemSettings.map((s, i) => renderSettingCard(s, i))}</div>
      </div>

      {/* 관리 도구 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl shadow-xl p-8"
      >
        <h3 className="text-xl font-bold mb-6">🛠️ 관리 도구</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-bold text-gray-700">데이터 관리</h4>
            <button
              onClick={() => alert('캐시 초기화 기능은 준비 중입니다.')}
              className="w-full px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold transition-colors"
            >
              🔄 캐시 초기화
            </button>
            <button
              onClick={() => alert('데이터베이스 최적화 기능은 준비 중입니다.')}
              className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors"
            >
              📊 데이터베이스 최적화
            </button>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-gray-700">시스템 상태</h4>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                <span className="font-bold">시스템 정상 운영 중</span>
              </div>
              <p className="text-sm text-green-600 mt-1">모든 서비스가 정상적으로 작동하고 있습니다.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>마지막 업데이트:</strong> {new Date().toLocaleString('ko-KR')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

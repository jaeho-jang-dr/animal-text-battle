import { motion } from 'framer-motion';

export interface AdminStats {
  totalUsers: number;
  guestUsers: number;
  registeredUsers: number;
  totalCharacters: number;
  botCharacters: number;
  totalBattles: number;
  activeUsers: number;
  suspendedUsers: number;
  onlineUsersCount: number;
  todayBattles: number;
  weekBattles: number;
  averageElo: number;
  topCharacters: any[];
  recentBattles: any[];
  warningUsers: any[];
  animalStats: any[];
  hourlyBattles: any[];
  dailyNewUsers: any[];
  onlineUsers: any[];
}

interface StatsTabProps {
  stats: AdminStats | null;
}

export default function StatsTab({ stats }: StatsTabProps) {
  return (
    <motion.div
      key="stats"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* 주요 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white rounded-xl shadow-lg p-6 text-center"
        >
          <div className="text-3xl mb-2">👥</div>
          <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
          <div className="text-gray-600">전체 사용자</div>
          <div className="text-sm text-gray-500 mt-1">
            일반: {stats?.registeredUsers || 0} / 게스트: {stats?.guestUsers || 0}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white rounded-xl shadow-lg p-6 text-center"
        >
          <div className="text-3xl mb-2">🦁</div>
          <div className="text-2xl font-bold">{stats?.totalCharacters || 0}</div>
          <div className="text-gray-600">전체 캐릭터</div>
          <div className="text-sm text-gray-500 mt-1">
            봇: {stats?.botCharacters || 0}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white rounded-xl shadow-lg p-6 text-center"
        >
          <div className="text-3xl mb-2">⚔️</div>
          <div className="text-2xl font-bold">{stats?.totalBattles || 0}</div>
          <div className="text-gray-600">전체 배틀</div>
          <div className="text-sm text-gray-500 mt-1">
            이번주: {stats?.weekBattles || 0}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white rounded-xl shadow-lg p-6 text-center"
        >
          <div className="text-3xl mb-2">✅</div>
          <div className="text-2xl font-bold text-green-600">{stats?.onlineUsersCount || 0}</div>
          <div className="text-gray-600">현재 접속자</div>
          <div className="text-sm text-gray-500 mt-1">
            활성: {stats?.activeUsers || 0}
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white rounded-xl shadow-lg p-6 text-center"
        >
          <div className="text-3xl mb-2">🚫</div>
          <div className="text-2xl font-bold text-red-600">{stats?.suspendedUsers || 0}</div>
          <div className="text-gray-600">정지 사용자</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white rounded-xl shadow-lg p-6 text-center"
        >
          <div className="text-3xl mb-2">📊</div>
          <div className="text-2xl font-bold">{stats?.todayBattles || 0}</div>
          <div className="text-gray-600">오늘 배틀</div>
        </motion.div>
      </div>

      {/* 상위 캐릭터 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl shadow-xl p-8"
      >
        <h2 className="text-2xl font-bold mb-6">🏆 상위 캐릭터 TOP 10</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-100 to-pink-100">
              <tr>
                <th className="px-4 py-3 text-left">순위</th>
                <th className="px-4 py-3 text-left">캐릭터</th>
                <th className="px-4 py-3 text-left">동물</th>
                <th className="px-4 py-3 text-center">ELO</th>
                <th className="px-4 py-3 text-center">승률</th>
                <th className="px-4 py-3 text-center">전적</th>
                <th className="px-4 py-3 text-left">소유자</th>
              </tr>
            </thead>
            <tbody>
              {stats?.topCharacters?.map((char, index) => (
                <motion.tr
                  key={char.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b hover:bg-purple-50"
                >
                  <td className="px-4 py-3">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `${index + 1}`}
                  </td>
                  <td className="px-4 py-3 font-bold">{char.character_name}</td>
                  <td className="px-4 py-3">
                    <span className="mr-2">{char.emoji}</span>
                    {char.korean_name}
                  </td>
                  <td className="px-4 py-3 text-center font-bold">{char.elo_score}</td>
                  <td className="px-4 py-3 text-center">
                    {char.total_battles > 0
                      ? Math.round((char.wins / char.total_battles) * 100)
                      : 0}%
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-green-600">{char.wins}승</span>
                    {' / '}
                    <span className="text-red-600">{char.losses}패</span>
                  </td>
                  <td className="px-4 py-3">
                    {char.owner_email || '게스트'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* 온라인 사용자 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl shadow-xl p-8 mb-8"
      >
        <h2 className="text-2xl font-bold mb-6">🟢 현재 접속중인 사용자</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats?.onlineUsers?.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-green-50 rounded-lg p-4 border border-green-200"
            >
              <div className="font-bold">{user.display_name || user.email}</div>
              <div className="text-sm text-gray-600">
                캐릭터: {user.character_count}개
              </div>
              <div className="text-xs text-gray-500 mt-1">
                마지막 활동: {new Date(user.last_login).toLocaleTimeString('ko-KR')}
              </div>
            </motion.div>
          ))}
          {(!stats?.onlineUsers || stats.onlineUsers.length === 0) && (
            <div className="col-span-3 text-center text-gray-500 py-8">
              현재 접속중인 사용자가 없습니다
            </div>
          )}
        </div>
      </motion.div>

      {/* 최근 배틀 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl shadow-xl p-8"
      >
        <h2 className="text-2xl font-bold mb-6">⚔️ 최근 배틀 기록</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-purple-100 to-pink-100">
              <tr>
                <th className="px-4 py-3 text-left">시간</th>
                <th className="px-4 py-3 text-left">공격자</th>
                <th className="px-4 py-3 text-center">VS</th>
                <th className="px-4 py-3 text-left">방어자</th>
                <th className="px-4 py-3 text-center">승자</th>
                <th className="px-4 py-3 text-center">점수 변화</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentBattles?.map((battle, index) => (
                <motion.tr
                  key={battle.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b hover:bg-purple-50"
                >
                  <td className="px-4 py-3 text-sm">
                    {new Date(battle.created_at).toLocaleString('ko-KR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{battle.attacker_emoji}</span>
                      <div>
                        <div className="font-bold">{battle.attacker_name}</div>
                        <div className="text-xs text-gray-500">{battle.attacker_owner}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-purple-500 font-bold">VS</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span>{battle.defender_emoji}</span>
                      <div>
                        <div className="font-bold">{battle.defender_name}</div>
                        <div className="text-xs text-gray-500">{battle.defender_owner}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`font-bold ${battle.winner_id === battle.attacker_id ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {battle.winner_name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">
                    <div>
                      <span className={battle.attacker_score_change > 0 ? 'text-green-600' : 'text-red-600'}>
                        {battle.attacker_score_change > 0 ? '+' : ''}{battle.attacker_score_change}
                      </span>
                      {' / '}
                      <span className={battle.defender_score_change > 0 ? 'text-green-600' : 'text-red-600'}>
                        {battle.defender_score_change > 0 ? '+' : ''}{battle.defender_score_change}
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}

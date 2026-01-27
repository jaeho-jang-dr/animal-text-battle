// 사용자 타입
export interface User {
  id: string;
  email?: string;
  isGuest: boolean;
  displayName?: string;
  warningCount: number;
  isSuspended: boolean;
  suspendedReason?: string;
  createdAt: Date;
  lastLogin: Date;
  loginToken?: string;
  tokenExpiresAt?: Date;
}

// 동물 타입
// 동물 타입
export interface Animal {
  id: number;
  name: string;
  korean_name: string; // Updated to snake_case
  category: 'current' | 'mythical' | 'prehistoric' | 'custom'; // Added 'custom'
  sub_category: string; // Added
  emoji: string;
  description: string;
  kid_description: string; // Added
  habitat: string; // Added
  food: string; // Added
  speciality: string; // Added
  fun_fact: string; // Added

  // 전투 능력치 (Flat structure from animals-extended.ts)
  power: number;
  defense: number;
  speed: number;
  intelligence: number;

  battle_cry: string; // Updated to snake_case
  rarity: 'common' | 'rare' | 'epic' | 'legendary'; // Added
  unlock_level: number; // Added

  abilities?: string; // Optional/Legacy?
  imageUrl?: string;
  detailedInfo?: { // Keeping for backward compat if needed, but data has flat fields
    habitat?: string;
    food?: string;
    speciality?: string;
    funFact?: string;
  };
}

// 캐릭터 타입
export interface Character {
  id: string;
  userId: string;
  animalId: number;
  characterName: string;
  battleText?: string;
  baseScore: number;
  eloScore: number;
  activeBattlesToday: number;
  passiveBattlesToday: number;
  totalActiveBattles: number;
  totalPassiveBattles: number;
  wins: number;
  losses: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastBattleReset: Date;
  // 조인된 데이터
  animal?: Animal;
  user?: User;
  // 추가 속성들 (API 응답에서 포함될 수 있음)
  isBot?: boolean;
  animalIcon?: string;
  animalName?: string;
  winRate?: number;
}

// 배틀 타입
export interface Battle {
  id: string;
  attackerId: string;
  defenderId: string;
  battleType: 'active' | 'passive';
  winnerId?: string;
  attackerScoreChange: number;
  defenderScoreChange: number;
  attackerEloChange: number;
  defenderEloChange: number;
  aiJudgment?: string;
  aiReasoning?: string;
  createdAt: Date;
  // 조인된 데이터
  attacker?: Character;
  defender?: Character;
  winner?: Character;
}

// 리더보드 엔트리 타입
export interface LeaderboardEntry {
  id: string;
  characterName: string;
  baseScore: number;
  eloScore: number;
  wins: number;
  losses: number;
  totalBattles: number;
  winRate: number;
  animalName: string;
  animalKoreanName: string;
  animalEmoji: string;
  playerName?: string;
  rank: number;
}

// 경고 타입
export interface Warning {
  id: string;
  userId: string;
  warningType: string;
  content: string;
  characterId?: string;
  createdAt: Date;
}

// 관리자 설정 타입
export interface AdminSetting {
  id: number;
  settingKey: string;
  settingValue?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 관리자 로그 타입
export interface AdminLog {
  id: string;
  adminId?: string;
  actionType: string;
  targetType?: string;
  targetId?: string;
  details?: any;
  createdAt: Date;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 배틀 요청 타입
export interface BattleRequest {
  attackerId: string;
  defenderId: string;
  battleType: 'active' | 'passive';
}

// AI 판정 결과 타입
export interface AIJudgmentResult {
  winnerId: string;
  judgment: string;
  reasoning: string;
  attackerScoreChange: number;
  defenderScoreChange: number;
  attackerEloChange: number;
  defenderEloChange: number;
}

// 필터 결과 타입
export interface FilterResult {
  isClean: boolean;
  violations: string[];
  warningType?: string;
}

// 배틀 비교 타입 내보내기
export * from './battle-comparison';

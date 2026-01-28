import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../app/api/battles/history/route';
import { db } from '../lib/db';
import { battleHistoryCache } from '../lib/cache/battle-history-cache';

// Mock the database
vi.mock('../lib/db', () => ({
  db: {
    prepare: vi.fn()
  }
}));

describe('Battle History Endpoint', () => {
  const mockToken = 'valid-test-token-123';
  const mockUserId = 'user-123';
  const mockCharacterId = 'char-456';
  
  const mockUser = {
    id: mockUserId,
    login_token: mockToken,
    token_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };

  const mockCharacter = {
    id: mockCharacterId,
    user_id: mockUserId,
    character_name: '테스트 캐릭터',
    base_score: 1100,
    elo_score: 1550
  };

  const mockBattles = [
    {
      id: 'battle-1',
      attacker_id: mockCharacterId,
      defender_id: 'opponent-1',
      winner_id: mockCharacterId,
      attacker_score_change: 10,
      defender_score_change: -10,
      attacker_elo_change: 15,
      defender_elo_change: -15,
      ai_judgment: '공격자 승리!',
      ai_reasoning: '더 강력한 공격이었습니다.',
      created_at: new Date().toISOString(),
      my_role: 'active',
      my_score_change: 10,
      my_elo_change: 15,
      opponent_id: 'opponent-1',
      opponent_name: '상대 캐릭터',
      opponent_animal_name: 'Lion',
      opponent_animal_korean_name: '사자',
      opponent_animal_emoji: '🦁'
    }
  ];

  beforeEach(() => {
    // Clear cache before each test
    battleHistoryCache.clear();
    
    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 when no token provided', async () => {
      const request = new NextRequest('http://localhost:3008/api/battles/history?characterId=123');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('로그인이 필요합니다.');
    });

    it('should return 401 when token is invalid', async () => {
      (db.prepare as any).mockReturnValue({
        get: vi.fn().mockReturnValue(null)
      });

      const request = new NextRequest('http://localhost:3008/api/battles/history?characterId=123', {
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('유효하지 않은 토큰입니다');
    });
  });

  describe('Character Validation', () => {
    it('should return 400 when characterId is missing', async () => {
      (db.prepare as any).mockReturnValue({
        get: vi.fn().mockReturnValue(mockUser)
      });

      const request = new NextRequest('http://localhost:3008/api/battles/history', {
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('캐릭터 ID가 필요합니다.');
    });

    it('should return 404 when character not found', async () => {
      (db.prepare as any)
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue(mockUser) })
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue(null) });

      const request = new NextRequest('http://localhost:3008/api/battles/history?characterId=nonexistent', {
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('캐릭터를 찾을 수 없습니다.');
    });

    it('should return 403 when user does not own character', async () => {
      const otherCharacter = { ...mockCharacter, user_id: 'other-user' };
      
      (db.prepare as any)
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue(mockUser) })
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue(otherCharacter) });

      const request = new NextRequest(`http://localhost:3008/api/battles/history?characterId=${mockCharacterId}`, {
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('권한이 없습니다.');
    });
  });

  describe('Battle History Retrieval', () => {
    beforeEach(() => {
      // Mock successful auth and character lookup
      (db.prepare as any)
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue(mockUser) })
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue(mockCharacter) })
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue({ count: 50 }) })
        .mockReturnValueOnce({ all: vi.fn().mockReturnValue(mockBattles) });
    });

    it('should return battle history successfully', async () => {
      const request = new NextRequest(`http://localhost:3008/api/battles/history?characterId=${mockCharacterId}`, {
        headers: {
          'Authorization': `Bearer ${mockToken}`
        }
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.history).toHaveLength(1);
      expect(data.data.pagination).toEqual({
        limit: 20,
        offset: 0,
        total: 50,
        hasMore: true
      });
    });

    it('should handle pagination parameters', async () => {
      const request = new NextRequest(
        `http://localhost:3008/api/battles/history?characterId=${mockCharacterId}&limit=10&offset=20`, 
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.pagination).toEqual({
        limit: 10,
        offset: 20,
        total: 50,
        hasMore: true
      });
    });
  });

  describe('Caching', () => {
    beforeEach(() => {
      // Mock successful auth and data
      (db.prepare as any)
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue(mockUser) })
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue(mockCharacter) })
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue({ count: 50 }) })
        .mockReturnValueOnce({ all: vi.fn().mockReturnValue(mockBattles) });
    });

    it('should cache results on first request', async () => {
      const request = new NextRequest(
        `http://localhost:3008/api/battles/history?characterId=${mockCharacterId}`,
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cached).not.toBe(true);

      // Check cache was populated
      const cachedData = battleHistoryCache.get(mockCharacterId, {
        limit: 20,
        offset: 0,
        includeStats: false,
        includeTimeline: false
      });
      expect(cachedData).toBeDefined();
    });

    it('should return cached data on subsequent requests', async () => {
      // First request to populate cache
      const request1 = new NextRequest(
        `http://localhost:3008/api/battles/history?characterId=${mockCharacterId}`,
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );
      await GET(request1);

      // Reset mocks for second request
      vi.clearAllMocks();
      (db.prepare as any)
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue(mockUser) });

      // Second request should hit cache
      const request2 = new NextRequest(
        `http://localhost:3008/api/battles/history?characterId=${mockCharacterId}`,
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      const response = await GET(request2);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cached).toBe(true);
      // Should not have called character or battle queries
      expect(db.prepare).toHaveBeenCalledTimes(1); // Only user auth check
    });

    it('should bypass cache when patterns or predictions requested', async () => {
      const request = new NextRequest(
        `http://localhost:3008/api/battles/history?characterId=${mockCharacterId}&includePatterns=true`,
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.cached).not.toBe(true);
    });
  });

  describe('Advanced Features', () => {
    beforeEach(() => {
      // Mock with stats calculation data
      (db.prepare as any)
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue(mockUser) })
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue(mockCharacter) })
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue({ count: 50 }) })
        .mockReturnValueOnce({ all: vi.fn().mockReturnValue(mockBattles) })
        // Stats queries
        .mockReturnValueOnce({ 
          get: vi.fn().mockReturnValue({ 
            total_battles: 50, 
            wins: 35, 
            losses: 15 
          }) 
        })
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue({ avg_change: 5.5 }) })
        .mockReturnValueOnce({ all: vi.fn().mockReturnValue([]) })
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue(null) })
        .mockReturnValueOnce({ get: vi.fn().mockReturnValue(null) });
    });

    it('should include stats when requested', async () => {
      const request = new NextRequest(
        `http://localhost:3008/api/battles/history?characterId=${mockCharacterId}&includeStats=true`,
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.stats).toBeDefined();
      expect(data.data.stats.totalBattles).toBe(50);
      expect(data.data.stats.wins).toBe(35);
      expect(data.data.stats.losses).toBe(15);
      expect(data.data.stats.winRate).toBe(70);
    });

    it('should include patterns when requested', async () => {
      const request = new NextRequest(
        `http://localhost:3008/api/battles/history?characterId=${mockCharacterId}&includeStats=true&includePatterns=true`,
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.patterns).toBeDefined();
      expect(Array.isArray(data.data.patterns)).toBe(true);
    });

    it('should include predictions when requested', async () => {
      const request = new NextRequest(
        `http://localhost:3008/api/battles/history?characterId=${mockCharacterId}&includeStats=true&includePredictions=true`,
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.predictions).toBeDefined();
      expect(Array.isArray(data.data.predictions)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      (db.prepare as any).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = new NextRequest(
        `http://localhost:3008/api/battles/history?characterId=${mockCharacterId}`,
        {
          headers: {
            'Authorization': `Bearer ${mockToken}`
          }
        }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('배틀 히스토리 조회 중 오류가 발생했습니다.');
      
      // In development, should include error details
      if (process.env.NODE_ENV === 'development') {
        expect(data.details).toBe('Database connection failed');
      }
    });
  });
});
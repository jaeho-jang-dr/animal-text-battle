import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../lib/db';

// GET: 경고 내역 조회
export async function GET(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const adminToken = request.headers.get('X-Admin-Token');
    if (!adminToken) {
      return NextResponse.json({
        success: false,
        error: '관리자 권한이 필요합니다'
      }, { status: 401 });
    }

    const admin = await db.prepare(`
      SELECT * FROM admin_users 
      WHERE auth_token = ?
    `).get(adminToken);

    if (!admin) {
      return NextResponse.json({
        success: false,
        error: '유효하지 않은 관리자 토큰입니다'
      }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = `
      SELECT 
        w.*,
        u.display_name,
        u.email,
        u.is_guest,
        c.character_name
      FROM warnings w
      JOIN users u ON w.user_id = u.id
      LEFT JOIN characters c ON w.character_id = c.id
    `;

    const params = [];
    if (userId) {
      query += ` WHERE w.user_id = ?`;
      params.push(userId);
    }

    query += ` ORDER BY w.created_at DESC LIMIT ?`;
    params.push(limit);

    const warnings = await db.prepare(query).all(...params);

    // 경고 유형별 통계
    const stats = await db.prepare(`
      SELECT 
        warning_type,
        COUNT(*) as count
      FROM warnings
      GROUP BY warning_type
      ORDER BY count DESC
    `).all();

    return NextResponse.json({
      success: true,
      data: {
        warnings,
        stats
      }
    });
  } catch (error) {
    console.error('Warnings fetch error:', error);
    return NextResponse.json({
      success: false,
      error: '경고 내역을 불러오는 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}

// POST: 사용자에게 경고 발송
export async function POST(request: NextRequest) {
  try {
    // 관리자 인증 확인
    const adminToken = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!adminToken) {
      return NextResponse.json({ success: false, error: '관리자 권한이 필요합니다' }, { status: 401 });
    }

    // Body 파싱
    const { userId, reason, warningType } = await request.json();
    if (!userId || !reason) {
      return NextResponse.json({ success: false, error: '필수 항목이 누락되었습니다' }, { status: 400 });
    }

    // 경고 추가
    const result = await db.transaction(async (tx) => {
      // 1. 경고 기록 추가
      const { lastInsertRowid } = tx.prepare(`
        INSERT INTO warnings (user_id, reason, warning_type, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).run(userId, reason, warningType || 'inappropriate_content');

      // 2. 사용자 경고 카운트 증가
      tx.prepare(`
        UPDATE users 
        SET warning_count = warning_count + 1
        WHERE id = ?
      `).run(userId);

      // 3. 사용자 정보 조회 (경고 횟수 확인)
      const user = tx.prepare(`SELECT warning_count, is_suspended, email FROM users WHERE id = ?`).get(userId) as any;

      // 4. 삼진아웃 처리 (경고 3회 이상시 자동 정지)
      let autoSuspended = false;
      if (user.warning_count >= 3 && !user.is_suspended) {
        tx.prepare(`
          UPDATE users 
          SET is_suspended = 1, suspended_at = datetime('now'), suspension_reason = '경고 누적(3회)에 의한 자동 정지'
          WHERE id = ?
        `).run(userId);
        autoSuspended = true;
      }

      return { warningId: lastInsertRowid, user, autoSuspended };
    });

    return NextResponse.json({
      success: true,
      data: {
        message: '경고가 발송되었습니다',
        warningCount: result.user.warning_count,
        isSuspended: result.user.is_suspended || result.autoSuspended,
        autoSuspended: result.autoSuspended
      }
    });

  } catch (error) {
    console.error('Warning creation error:', error);
    return NextResponse.json({
      success: false,
      error: '경고 발송 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}
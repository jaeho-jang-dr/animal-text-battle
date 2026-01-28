import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '../../../../lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        // 1. Auth Check - 배틀은 로그인한 사용자만 가능
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);

        const body = await request.json();
        const {
            attackerId,
            defenderId,
            winnerId,
            attackerScoreChange,
            defenderScoreChange,
            attackerEloChange,
            defenderEloChange
        } = body;

        if (!attackerId || !defenderId) {
            return NextResponse.json({ success: false, error: 'Missing IDs' }, { status: 400 });
        }

        console.log(`Executing battle: ${attackerId} vs ${defenderId}, Winner: ${winnerId}`);

        const isAttackerWin = winnerId === attackerId;

        const batch = adminDb.batch();
        const attackerRef = adminDb.collection('characters').doc(attackerId);
        const defenderRef = adminDb.collection('characters').doc(defenderId);

        // Attacker Update
        batch.update(attackerRef, {
            activeBattlesToday: FieldValue.increment(1),
            totalActiveBattles: FieldValue.increment(1),
            baseScore: FieldValue.increment(attackerScoreChange),
            eloScore: FieldValue.increment(attackerEloChange),
            wins: FieldValue.increment(isAttackerWin ? 1 : 0),
            losses: FieldValue.increment(isAttackerWin ? 0 : 1),
            updatedAt: FieldValue.serverTimestamp()
        });

        // Defender Update
        batch.update(defenderRef, {
            totalPassiveBattles: FieldValue.increment(1),
            baseScore: FieldValue.increment(defenderScoreChange),
            eloScore: FieldValue.increment(defenderEloChange),
            wins: FieldValue.increment(isAttackerWin ? 0 : 1),
            losses: FieldValue.increment(isAttackerWin ? 1 : 0),
            updatedAt: FieldValue.serverTimestamp()
        });

        await batch.commit();

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Battle execution error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

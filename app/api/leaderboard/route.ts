import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Fetch all active characters
        // For a large app, this should be paginated or limited.
        // For now, fetching all active characters is fine (< 1000).
        const snapshot = await adminDb.collection('characters')
            .where('isActive', '==', true)
            .get();

        const characters = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Debug logging
        const botCount = characters.filter((c: any) => c.isBot === true).length;
        console.log(`[Leaderboard API] Total characters: ${characters.length}, Bots: ${botCount}`);

        return NextResponse.json({ success: true, data: characters });
    } catch (error: any) {
        console.error('Leaderboard fetch error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

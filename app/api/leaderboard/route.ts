import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '../../../lib/firebase-admin';

export const dynamic = 'force-dynamic';

// 이메일에서 로그인 아이디 추출 (@ 앞부분, 최대 8자)
function getLoginId(email: string | undefined | null): string {
    if (!email) return '';
    const localPart = email.split('@')[0];
    return localPart.length > 8 ? localPart.substring(0, 8) + '..' : localPart;
}

export async function GET(request: NextRequest) {
    try {
        // Fetch all active characters
        const snapshot = await adminDb.collection('characters')
            .where('isActive', '==', true)
            .get();

        // 캐릭터 데이터 가공 - 사용자 이메일 포함
        const characters = await Promise.all(
            snapshot.docs.map(async (doc) => {
                const charData = doc.data();

                // 사용자 정보 조회
                let userEmail = '';
                let userLoginId = '';
                let isGuest = false;

                if (charData.userId && !charData.isBot) {
                    try {
                        const userDoc = await adminDb.collection('users').doc(charData.userId).get();
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            userEmail = userData?.email || '';
                            userLoginId = getLoginId(userData?.email);
                            isGuest = userData?.is_guest || false;
                        }
                    } catch (e) {
                        console.error('User fetch error:', e);
                    }
                }

                return {
                    id: doc.id,
                    ...charData,
                    user: {
                        email: userEmail,
                        loginId: userLoginId,
                        isGuest: isGuest,
                    }
                };
            })
        );

        // Debug logging
        const botCount = characters.filter((c: any) => c.isBot === true).length;
        console.log(`[Leaderboard API] Total characters: ${characters.length}, Bots: ${botCount}`);

        return NextResponse.json({ success: true, data: characters });
    } catch (error: any) {
        console.error('Leaderboard fetch error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

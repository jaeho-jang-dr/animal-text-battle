import { NextRequest, NextResponse } from 'next/server';
import { geminiStats } from '@/lib/gemini-stats';

// API 사용량 통계를 반환하는 엔드포인트
export async function GET(request: NextRequest) {
    try {
        const stats = geminiStats.getStats();

        const response = {
            success: true,
            stats: {
                // Real-time statistics
                usage: {
                    totalCalls: stats.totalCalls,
                    successfulCalls: stats.successfulCalls,
                    failedCalls: stats.failedCalls,
                    cachedResponses: stats.cachedResponses,
                    rateLimitHits: stats.rateLimitHits,
                    successRate: stats.totalCalls > 0
                        ? ((stats.successfulCalls / stats.totalCalls) * 100).toFixed(1) + '%'
                        : 'N/A',
                    cacheHitRate: (stats.totalCalls + stats.cachedResponses) > 0
                        ? ((stats.cachedResponses / (stats.totalCalls + stats.cachedResponses)) * 100).toFixed(1) + '%'
                        : 'N/A',
                    lastCallTimestamp: stats.lastCallTimestamp,
                    lastCallAgo: stats.lastCallTimestamp
                        ? `${Math.floor((Date.now() - stats.lastCallTimestamp) / 1000)}초 전`
                        : '없음'
                },

                // Recent errors
                recentErrors: stats.errors.map(err => ({
                    error: err.error,
                    timeAgo: `${Math.floor((Date.now() - err.timestamp) / 1000)}초 전`,
                    timestamp: err.timestamp
                })),

                // Configuration
                config: {
                    apiKeyConfigured: !!process.env.GEMINI_API_KEY,
                    model: 'gemini-1.5-flash',
                    rateLimits: {
                        maxCallsPerMinute: 12,
                        freeQuotaDaily: 1500,
                    },
                    caching: {
                        enabled: true,
                        ttl: '5분'
                    }
                },

                // Recommendations
                recommendations: [
                    '✅ 동일한 캐릭터/동물 조합은 5분간 캐시됩니다',
                    '⏱️ 분당 최대 12회 호출로 제한됩니다 (무료 한도 15 RPM)',
                    '🔄 429 에러 발생 시 자동으로 재시도합니다 (최대 3회)',
                    '🔑 API 키가 차단된 경우 Google AI Studio에서 새 키를 발급받으세요'
                ],

                // Useful links
                links: {
                    aiStudio: 'https://aistudio.google.com/apikey',
                    quotaManagement: 'https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas',
                    documentation: 'https://ai.google.dev/gemini-api/docs'
                }
            }
        };

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('API Stats Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// POST endpoint to reset statistics
export async function POST(request: NextRequest) {
    try {
        geminiStats.reset();
        return NextResponse.json({
            success: true,
            message: '통계가 초기화되었습니다.'
        });
    } catch (error: any) {
        console.error('Stats Reset Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

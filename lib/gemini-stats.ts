// ============================================
// 🎯 GEMINI API USAGE STATISTICS TRACKER
// ============================================
// This module tracks API usage statistics that can be accessed
// by admin endpoints for monitoring

interface UsageStats {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    cachedResponses: number;
    rateLimitHits: number;
    lastCallTimestamp: number | null;
    errors: {
        timestamp: number;
        error: string;
    }[];
}

class GeminiStatsTracker {
    private stats: UsageStats = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        cachedResponses: 0,
        rateLimitHits: 0,
        lastCallTimestamp: null,
        errors: []
    };

    recordCall() {
        this.stats.totalCalls++;
        this.stats.lastCallTimestamp = Date.now();
    }

    recordSuccess() {
        this.stats.successfulCalls++;
    }

    recordFailure(error: string) {
        this.stats.failedCalls++;
        this.stats.errors.push({
            timestamp: Date.now(),
            error
        });

        // Keep only last 20 errors
        if (this.stats.errors.length > 20) {
            this.stats.errors.shift();
        }
    }

    recordCacheHit() {
        this.stats.cachedResponses++;
    }

    recordRateLimitHit() {
        this.stats.rateLimitHits++;
    }

    getStats(): UsageStats {
        return { ...this.stats };
    }

    reset() {
        this.stats = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            cachedResponses: 0,
            rateLimitHits: 0,
            lastCallTimestamp: null,
            errors: []
        };
    }
}

// Export singleton instance
export const geminiStats = new GeminiStatsTracker();

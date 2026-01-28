import { GoogleGenerativeAI } from "@google/generative-ai";
import { geminiStats } from "./gemini-stats";


// Initialize Gemini API - FORCE reload from environment
const apiKey = process.env.GEMINI_API_KEY?.trim();

console.log("=== GEMINI INITIALIZATION DEBUG ===");
console.log("API Key Status:", apiKey ? `Found (${apiKey.substring(0, 10)}...)` : "MISSING");
console.log("Full Env Keys:", Object.keys(process.env).filter(k => k.includes('GEMINI')));

if (!apiKey) {
    console.error("CRITICAL: GEMINI_API_KEY is missing in environment variables!");
}

const genAI = new GoogleGenerativeAI(apiKey || '');

// ============================================
// 🚀 RATE LIMITING & CACHING SYSTEM
// ============================================

// In-memory cache for responses (simple LRU-like cache)
interface CacheEntry {
    response: string;
    timestamp: number;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Rate limiter: Track API calls to avoid hitting 15 RPM limit
const rateLimiter = {
    calls: [] as number[],
    maxCallsPerMinute: 12, // Conservative limit (below 15 RPM)

    canMakeCall(): boolean {
        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;

        // Remove calls older than 1 minute
        this.calls = this.calls.filter(time => time > oneMinuteAgo);

        return this.calls.length < this.maxCallsPerMinute;
    },

    recordCall(): void {
        this.calls.push(Date.now());
    },

    async waitForSlot(): Promise<void> {
        while (!this.canMakeCall()) {
            geminiStats.recordRateLimitHit(); // Track rate limit hit
            const oldestCall = this.calls[0];
            const waitTime = (oldestCall + 60 * 1000) - Date.now() + 1000; // +1s buffer
            console.log(`[RateLimiter] 대기 중... ${Math.ceil(waitTime / 1000)}초 후 재시도`);
            await sleep(waitTime);
        }
    }
};

// Request queue to serialize API calls
let requestQueue = Promise.resolve();

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Generate cache key from prompt
function getCacheKey(prompt: string, isJson: boolean): string {
    return `${isJson ? 'json' : 'text'}:${prompt.substring(0, 200)}`;
}

// Check cache for existing response
function getCachedResponse(cacheKey: string): string | null {
    const cached = responseCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        console.log(`[Cache] ✅ 캐시 히트! (${Math.floor((Date.now() - cached.timestamp) / 1000)}초 전)`);
        geminiStats.recordCacheHit(); // Track cache hit
        return cached.response;
    }
    return null;
}

// Save response to cache
function cacheResponse(cacheKey: string, response: string): void {
    responseCache.set(cacheKey, {
        response,
        timestamp: Date.now()
    });

    // Simple cache cleanup: remove old entries if cache is too large
    if (responseCache.size > 100) {
        const oldestKey = Array.from(responseCache.entries())
            .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
        responseCache.delete(oldestKey);
    }
}

// Exponential backoff retry logic
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            const msg = error.message || "";

            // Only retry on rate limit or server errors
            if (msg.includes("429") || msg.includes("503") || msg.includes("RESOURCE_EXHAUSTED")) {
                const delay = baseDelay * Math.pow(2, attempt);
                console.log(`[Retry] 시도 ${attempt + 1}/${maxRetries} 실패. ${delay}ms 후 재시도...`);
                await sleep(delay);
                continue;
            }

            // Don't retry on other errors
            throw error;
        }
    }

    throw lastError || new Error("재시도 실패");
}

// Helper to get response text safely using ONLY the working model
async function generateWithFallback(prompt: string, isJson: boolean = false): Promise<string> {
    // Check cache first
    const cacheKey = getCacheKey(prompt, isJson);
    const cached = getCachedResponse(cacheKey);
    if (cached) {
        return cached;
    }

    // Queue the request to avoid parallel calls
    return new Promise((resolve, reject) => {
        requestQueue = requestQueue.then(async () => {
            try {
                // Record that we're attempting a call
                geminiStats.recordCall();

                // Wait for rate limiter slot
                await rateLimiter.waitForSlot();

                console.log(`[Gemini] 🚀 API 호출 시작 (JSON: ${isJson})`);
                console.log(`[Gemini] 현재 분당 호출 수: ${rateLimiter.calls.length}/${rateLimiter.maxCallsPerMinute}`);

                // 모델 목록 - 2.0 이상만 사용, 첫 번째 실패 시 다음 모델 시도
                const modelNames = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-2.0-pro"];
                let lastError: Error | null = null;

                for (const currentModel of modelNames) {
                    try {
                        console.log(`[Gemini] 🔄 모델 시도: ${currentModel}`);

                        const model = genAI.getGenerativeModel({
                            model: currentModel,
                            generationConfig: {
                                maxOutputTokens: 300,
                                responseMimeType: isJson ? "application/json" : "text/plain"
                            }
                        });

                        const apiResult = isJson
                            ? await model.generateContent({
                                contents: [{ role: "user", parts: [{ text: prompt }] }]
                            })
                            : await model.generateContent(prompt);

                        const response = await apiResult.response;
                        const result = response.text();

                        // 성공
                        rateLimiter.recordCall();
                        geminiStats.recordSuccess();
                        cacheResponse(cacheKey, result);
                        console.log(`[Gemini] ✅ ${currentModel} 성공! (응답 길이: ${result.length}자)`);
                        resolve(result);
                        return;
                    } catch (modelError: any) {
                        console.error(`[Gemini] ${currentModel} 실패:`, modelError.message);
                        lastError = modelError;
                        // 다음 모델 시도
                        continue;
                    }
                }

                // 모든 모델 실패
                throw lastError || new Error("모든 AI 모델 호출 실패");
            } catch (error: any) {
                console.error(`[Gemini] ❌ 실패:`, error);
                console.error(`[Gemini] Error details:`, {
                    message: error.message,
                    stack: error.stack,
                    name: error.name,
                    status: error.status,
                    statusText: error.statusText
                });

                // Handle specific error codes
                const msg = error.message || "";
                const statusCode = error.status || (msg.match(/\d{3}/)?.[0]);
                let errorMsg = "";

                if (msg.includes("503") || statusCode === "503") {
                    errorMsg = "🔴 AI 서버가 일시적으로 과부하입니다. 잠시 후 다시 시도해주세요.";
                } else if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || statusCode === "429") {
                    errorMsg = "⏱️ API 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
                } else if (msg.includes("404") || statusCode === "404") {
                    errorMsg = "🔍 AI 모델을 찾을 수 없습니다. 잠시 후 다시 시도해주세요.";
                } else if (msg.includes("API_KEY_INVALID") || msg.includes("invalid API key")) {
                    errorMsg = "🚫 API 키가 유효하지 않습니다. 키를 확인해주세요.";
                } else if (msg.includes("leaked") || msg.includes("compromised")) {
                    errorMsg = "🚫 API 키가 노출되어 차단되었습니다. 새 키가 필요합니다.";
                } else if (msg.includes("403") || statusCode === "403") {
                    // 403은 여러 이유가 있을 수 있음 - 실제 메시지 포함
                    errorMsg = `⚠️ API 접근 거부: ${msg.substring(0, 100)}`;
                } else if (msg.includes("PERMISSION_DENIED")) {
                    errorMsg = "⚠️ API 권한이 없습니다. Gemini API 활성화를 확인해주세요.";
                } else {
                    errorMsg = `AI 오류: ${msg.substring(0, 100)}`;
                }

                // Record failure with error message
                geminiStats.recordFailure(errorMsg);

                reject(new Error(errorMsg));
            }
        });
    });
}

export async function generateBattleText(animalName: string, characterName: string): Promise<string> {
    console.log("[generateBattleText] Starting generation for:", { animalName, characterName });
    console.log("[generateBattleText] API Key check:", apiKey ? `Present (${apiKey.substring(0, 10)}...)` : "MISSING");

    if (!apiKey) {
        throw new Error("API Key가 설정되지 않았습니다. (.env.local 확인 필요)");
    }

    const prompt = `
    당신은 창의적인 작가입니다. 동물 텍스트 배틀 게임의 캐릭터 대사를 작성해주세요.

    동물: ${animalName}
    캐릭터 이름: ${characterName}

    조건:
    1. **절대 100자를 넘기지 마세요.** (가급적 50자 내외로 짧게!)
    2. 딱 1~2문장으로 임팩트 있게 작성하세요.
    3. 자신감 넘치고, 자기 동물의 특징을 살린 내용.
    4. 아이들이 보기에 적절한 내용 (비속어 금지).
    5. "~다", "~까" 등의 당당한 어미 사용.

    예시:
    "나는 초원의 지배자 사자왕이다! 나의 우렁찬 포효를 들어라!"
    "날렵한 치타처럼 너를 제압해주지. 준비는 되었나?"

    출력:
  `;

    try {
        let text = await generateWithFallback(prompt, false);
        text = text.trim();

        // Remove quotes if present
        text = text.replace(/^["']|["']$/g, '');

        // Force truncate if too long (safety net)
        // User requested 98 characters limit
        if (text.length > 98) {
            // Cut at the last punctuation mark before 98 chars to keep it natural
            const cutIndex = text.lastIndexOf('.', 98);
            if (cutIndex > 0) {
                text = text.substring(0, cutIndex + 1);
            } else {
                // Fallback: just hard cut
                text = text.substring(0, 98) + "...";
            }
        }

        console.log("[generateBattleText] Success! Generated text:", text);
        return text;
    } catch (error: any) {
        console.error("[generateBattleText] Error:", error);
        // Propagate the error message clearly
        throw error;
    }
}

export async function judgeBattleWithAI(
    attackerName: string,
    attackerAnimal: string,
    attackerText: string,
    defenderName: string,
    defenderAnimal: string,
    defenderText: string
): Promise<{
    winner: 'attacker' | 'defender';
    reasoning: string;
    judgment: string;
}> {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY is not set");
    }

    const prompt = `
    당신은 "동물 텍스트 배틀"의 공정한 심판입니다. 두 캐릭터의 배틀 텍스트를 보고 승자를 결정해주세요.

    [공격자]
    이름: ${attackerName} (${attackerAnimal})
    대사: "${attackerText}"

    [방어자]
    이름: ${defenderName} (${defenderAnimal})
    대사: "${defenderText}"

    판정 기준:
    1. 대사의 창의성과 박력 (70%)
    2. 동물의 특징을 얼마나 잘 표현했는가 (30%)
    3. 전투력 수치는 무시하고 오직 "텍스트"로만 판정하세요.

    출력 형식 (JSON Only):
    {
      "winner": "attacker" 또는 "defender",
      "judgment": "한 줄짜리 짧고 극적인 판정 멘트 (예: 공격자의 포효가 하늘을 찌릅니다!)",
      "reasoning": "승리 이유를 아이들에게 설명하듯이 친절하고 구체적으로 2문장 내외."
    }
  `;

    try {
        const jsonText = await generateWithFallback(prompt, true);
        const parsed = JSON.parse(jsonText);
        // Validate response structure slightly
        if (!parsed.winner || !parsed.judgment) {
            throw new Error("Invalid AI response structure");
        }
        return parsed;
    } catch (error) {
        console.error("Gemini Judge Error:", error);
        // Fallback if AI fails: Random or Length based
        return {
            winner: attackerText.length > defenderText.length ? 'attacker' : 'defender',
            judgment: "AI 심판이 잠시 자리를 비웠네요! 더 길고 정성스러운 대사를 쓴 쪽이 이깁니다!",
            reasoning: "AI 연결 상태가 좋지 않아 텍스트 길이로 판정했습니다."
        };
    }
}

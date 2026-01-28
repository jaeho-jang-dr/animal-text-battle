import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("GEMINI_API_KEY is missing in environment variables!");
} else {
    console.log("Gemini API Key loaded (starts with " + apiKey.substring(0, 4) + ")");
}

const genAI = new GoogleGenerativeAI(apiKey || '');

// Model for text generation (Flash is faster and cheaper, Pro is smarter)
// Switched to gemini-1.5-flash for better stability in production
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function generateBattleText(animalName: string, characterName: string): Promise<string> {
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
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text().trim();

        // Remove quotes if present
        text = text.replace(/^["']|["']$/g, '');

        // Force truncate if too long (safety net)
        if (text.length > 95) {
            // Cut at the last punctuation mark before 95 chars to keep it natural
            const cutIndex = text.lastIndexOf('.', 95);
            if (cutIndex > 0) {
                text = text.substring(0, cutIndex + 1);
            } else {
                // Fallback: just hard cut
                text = text.substring(0, 95) + "...";
            }
        }
        return text;
    } catch (error: any) {
        console.error("Gemini Generation Error:", error);
        throw new Error(`AI 생성 실패: ${error.message}`);
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
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });
        const response = await result.response;
        const jsonText = response.text();
        return JSON.parse(jsonText);
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

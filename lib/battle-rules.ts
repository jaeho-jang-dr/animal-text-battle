/**
 * 텍스트 배틀 판정 규칙 시스템
 * AI 없이 규칙 기반으로 승부를 판정합니다.
 */

// ============================================
// 1. 점수 카테고리 정의
// ============================================

export interface BattleScore {
  creativity: number;      // 창의성 (0-30점)
  animalTrait: number;     // 동물 특징 표현 (0-25점)
  impact: number;          // 임팩트/박력 (0-20점)
  humor: number;           // 유머/재치 (0-15점)
  length: number;          // 적절한 길이 (0-10점)
  total: number;           // 총점 (0-100점)
}

// ============================================
// 2. 판정 규칙 (100개)
// ============================================

// 2.1 창의성 규칙 (30개) - 최대 30점
export const creativityRules = [
  // 긍정 규칙 (+점수)
  { pattern: /비유|처럼|같은|마치/g, score: 2, desc: "비유 표현 사용" },
  { pattern: /의성어|의태어|쿵|쾅|번쩍|휙|팍|슈웅|우르르/gi, score: 2, desc: "의성어/의태어" },
  { pattern: /!{2,}/g, score: 1, desc: "강조 느낌표" },
  { pattern: /\?!/g, score: 1, desc: "감탄 표현" },
  { pattern: /전설|신화|영웅|왕|황제|제왕/g, score: 2, desc: "위엄 있는 표현" },
  { pattern: /우주|세계|하늘|대지|바다|산/g, score: 1, desc: "웅장한 배경" },
  { pattern: /불꽃|번개|폭풍|태풍|회오리/g, score: 2, desc: "자연의 힘" },
  { pattern: /최강|무적|불패|천하제일/g, score: 2, desc: "최강 표현" },
  { pattern: /각오|준비|덤벼|도전/g, score: 1, desc: "도전적 표현" },
  { pattern: /빛|어둠|그림자|섬광/g, score: 1, desc: "빛과 어둠" },
  { pattern: /운명|숙명|정해진|피할 수 없/g, score: 2, desc: "운명적 표현" },
  { pattern: /공포|두려움|떨어라|무서운/g, score: 1, desc: "위협적 표현" },
  { pattern: /영광|승리|찬란|빛나는/g, score: 1, desc: "승리 표현" },
  { pattern: /이름을 기억|역사에 남/g, score: 2, desc: "역사적 표현" },
  { pattern: /진정한|참된|유일한/g, score: 1, desc: "진정성 강조" },

  // 부정 규칙 (-점수)
  { pattern: /바보|멍청|짜증/g, score: -3, desc: "부정적 단어" },
  { pattern: /ㅋㅋ|ㅎㅎ|ㅜㅜ|ㅠㅠ/g, score: -2, desc: "이모티콘 남용" },
  { pattern: /(.)\1{3,}/g, score: -2, desc: "문자 반복 (ㅋㅋㅋㅋ)" },
];

// 2.2 동물 특징 규칙 (25개) - 최대 25점
export const animalTraitKeywords: Record<string, string[]> = {
  // 포유류
  "사자": ["포효", "갈기", "왕", "초원", "사냥", "맹수", "용맹"],
  "호랑이": ["줄무늬", "산", "포효", "맹수", "어흥", "백두산", "용맹"],
  "늑대": ["울음", "달빛", "무리", "야생", "사냥", "송곳니"],
  "곰": ["힘", "거대", "발톱", "포옹", "겨울잠", "산"],
  "치타": ["속도", "빠른", "점무늬", "질주", "사냥"],
  "코끼리": ["거대", "코", "상아", "지혜", "무게", "힘"],
  "여우": ["영리", "꼬리", "교활", "지혜", "민첩"],
  "토끼": ["귀", "점프", "빠른", "귀여운", "달리기"],
  "판다": ["대나무", "흑백", "귀여운", "중국", "평화"],
  "캥거루": ["주머니", "점프", "복싱", "호주", "꼬리"],

  // 조류
  "독수리": ["하늘", "날개", "시력", "자유", "비상", "정상"],
  "매": ["빠른", "급강하", "사냥", "날카로운", "하늘"],
  "올빼미": ["지혜", "밤", "눈", "현명", "조용"],
  "펭귄": ["남극", "얼음", "수영", "턱시도", "귀여운"],
  "공작": ["깃털", "화려", "아름다운", "자태", "무지개"],
  "까마귀": ["검은", "지능", "영리", "신비"],
  "앵무새": ["말", "색깔", "화려한", "똑똑한"],

  // 파충류/양서류
  "뱀": ["독", "비늘", "몸통", "빠른", "냉혈"],
  "악어": ["이빨", "강", "턱", "잠복", "사냥"],
  "거북이": ["등껍질", "느린", "장수", "인내", "지혜"],
  "도마뱀": ["꼬리", "변색", "민첩", "재생"],
  "카멜레온": ["변색", "눈", "혀", "위장"],

  // 해양 생물
  "상어": ["이빨", "바다", "포식자", "공포", "지느러미"],
  "돌고래": ["지능", "수영", "점프", "친근", "초음파"],
  "고래": ["거대", "바다", "깊은", "노래", "평화"],
  "문어": ["다리", "지능", "잉크", "변장"],
  "해파리": ["투명", "촉수", "바다", "춤"],

  // 신화/전설
  "용": ["불", "비늘", "날개", "전설", "힘", "하늘", "신"],
  "유니콘": ["뿔", "마법", "순수", "빛", "무지개"],
  "피닉스": ["불", "재탄생", "불사", "날개", "화염"],
  "그리핀": ["독수리", "사자", "하늘", "용맹"],
  "페가수스": ["날개", "말", "하늘", "자유", "빛"],

  // 선사시대
  "티라노사우르스": ["이빨", "공룡", "포식자", "거대", "왕"],
  "프테라노돈": ["날개", "하늘", "공룡", "비행"],
  "트리케라톱스": ["뿔", "방패", "공룡", "돌진"],
  "벨로시랩터": ["발톱", "빠른", "영리", "사냥", "무리"],
  "스테고사우르스": ["등판", "꼬리", "스파이크", "방어"],

  // 곤충
  "사마귀": ["낫", "인내", "기다림", "사냥"],
  "장수풍뎅이": ["뿔", "힘", "갑옷", "싸움"],
  "나비": ["날개", "아름다운", "변신", "꽃"],
  "벌": ["침", "꿀", "부지런", "무리"],
  "개미": ["힘", "협동", "부지런", "무리"],
};

// 2.3 임팩트/박력 규칙 (20개) - 최대 20점
export const impactRules = [
  { pattern: /!$/g, score: 2, desc: "강한 마무리" },
  { pattern: /다!|라!|까!|자!/g, score: 2, desc: "당당한 어미" },
  { pattern: /^나는|내가|나의/g, score: 1, desc: "자신감 있는 시작" },
  { pattern: /이다!|이다\./g, score: 2, desc: "단호한 선언" },
  { pattern: /들어라|보아라|받아라/g, score: 2, desc: "명령형 표현" },
  { pattern: /각오해|준비해|대비해/g, score: 1, desc: "경고 표현" },
  { pattern: /무릎|꿇어|항복/g, score: 2, desc: "지배 표현" },
  { pattern: /상대가 안|상대가 되지/g, score: 1, desc: "우월 표현" },
  { pattern: /도망|피하지|물러서/g, score: 1, desc: "도전 표현" },
  { pattern: /어림없/g, score: 1, desc: "거부 표현" },
];

// 2.4 유머/재치 규칙 (15개) - 최대 15점
export const humorRules = [
  { pattern: /말장난|다지?(?=\s|$)/g, score: 2, desc: "말장난" },
  { pattern: /~다냥|~다옹|~다멍/g, score: 2, desc: "동물 어미" },
  { pattern: /헤헤|호호|하하/g, score: 1, desc: "웃음 표현" },
  { pattern: /놀랐지|깜짝|반전/g, score: 2, desc: "반전 요소" },
  { pattern: /비밀|사실은|알고 보면/g, score: 1, desc: "반전 암시" },
  { pattern: /뿅|짠|타다/g, score: 1, desc: "효과음" },
];

// 2.5 길이 규칙 (10점)
export function calculateLengthScore(text: string): number {
  const len = text.length;
  if (len >= 30 && len <= 60) return 10;  // 최적
  if (len >= 20 && len <= 80) return 7;   // 양호
  if (len >= 10 && len <= 100) return 4;  // 보통
  return 1;  // 너무 짧거나 김
}

// ============================================
// 3. 판정 메시지 (승리/패배 이유)
// ============================================

export const judgmentMessages = {
  creativity: {
    high: ["창의적인 표현이 돋보입니다!", "상상력이 풍부한 대사네요!"],
    low: ["좀 더 창의적인 표현을 써보세요!"]
  },
  animalTrait: {
    high: ["동물의 특징을 잘 살렸어요!", "진정한 동물의 왕이군요!"],
    low: ["동물의 특징을 더 살려보세요!"]
  },
  impact: {
    high: ["강렬한 임팩트!", "박력 넘치는 대사!"],
    low: ["좀 더 당당하게!"]
  },
  humor: {
    high: ["센스 만점!", "재치가 넘쳐요!"],
    low: ["유머를 더해보세요!"]
  },
  tie: [
    "막상막하의 대결!",
    "둘 다 정말 잘했어요!",
    "아슬아슬한 승부!"
  ]
};

// ============================================
// 4. 메인 판정 함수
// ============================================

export function calculateBattleScore(text: string, animalName: string): BattleScore {
  let creativity = 0;
  let animalTrait = 0;
  let impact = 0;
  let humor = 0;

  // 1. 창의성 점수
  creativityRules.forEach(rule => {
    const matches = text.match(rule.pattern);
    if (matches) {
      creativity += rule.score * matches.length;
    }
  });
  creativity = Math.max(0, Math.min(30, creativity));

  // 2. 동물 특징 점수
  const keywords = animalTraitKeywords[animalName] || [];
  keywords.forEach(keyword => {
    if (text.includes(keyword)) {
      animalTrait += 5;
    }
  });
  // 동물 이름 직접 언급
  if (text.includes(animalName)) {
    animalTrait += 3;
  }
  animalTrait = Math.min(25, animalTrait);

  // 3. 임팩트 점수
  impactRules.forEach(rule => {
    const matches = text.match(rule.pattern);
    if (matches) {
      impact += rule.score * matches.length;
    }
  });
  impact = Math.min(20, impact);

  // 4. 유머 점수
  humorRules.forEach(rule => {
    const matches = text.match(rule.pattern);
    if (matches) {
      humor += rule.score * matches.length;
    }
  });
  humor = Math.min(15, humor);

  // 5. 길이 점수
  const length = calculateLengthScore(text);

  // 총점
  const total = creativity + animalTrait + impact + humor + length;

  return {
    creativity,
    animalTrait,
    impact,
    humor,
    length,
    total
  };
}

export function judgeBattle(
  attackerText: string,
  attackerAnimal: string,
  defenderText: string,
  defenderAnimal: string
): {
  winner: 'attacker' | 'defender';
  attackerScore: BattleScore;
  defenderScore: BattleScore;
  judgment: string;
  reasoning: string;
} {
  const attackerScore = calculateBattleScore(attackerText, attackerAnimal);
  const defenderScore = calculateBattleScore(defenderText, defenderAnimal);

  let winner: 'attacker' | 'defender';
  let judgment: string;
  let reasoning: string;

  const scoreDiff = attackerScore.total - defenderScore.total;

  if (Math.abs(scoreDiff) <= 5) {
    // 접전 (5점 이내 차이)
    winner = scoreDiff >= 0 ? 'attacker' : 'defender';
    judgment = judgmentMessages.tie[Math.floor(Math.random() * judgmentMessages.tie.length)];
    reasoning = `접전 끝에 ${winner === 'attacker' ? '공격자' : '방어자'}가 ${Math.abs(scoreDiff)}점 차이로 승리!`;
  } else {
    winner = scoreDiff > 0 ? 'attacker' : 'defender';
    const winnerScore = winner === 'attacker' ? attackerScore : defenderScore;

    // 가장 높은 카테고리 찾기
    const categories = [
      { name: 'creativity', score: winnerScore.creativity, max: 30 },
      { name: 'animalTrait', score: winnerScore.animalTrait, max: 25 },
      { name: 'impact', score: winnerScore.impact, max: 20 },
      { name: 'humor', score: winnerScore.humor, max: 15 },
    ];

    const bestCategory = categories.reduce((a, b) =>
      (a.score / a.max) > (b.score / b.max) ? a : b
    );

    const msgs = judgmentMessages[bestCategory.name as keyof typeof judgmentMessages];
    if (msgs && 'high' in msgs) {
      judgment = msgs.high[Math.floor(Math.random() * msgs.high.length)];
    } else {
      judgment = "멋진 대결이었습니다!";
    }

    reasoning = `${winner === 'attacker' ? '공격자' : '방어자'}가 ${Math.abs(scoreDiff)}점 차이로 승리! (총점: ${winner === 'attacker' ? attackerScore.total : defenderScore.total}점)`;
  }

  return {
    winner,
    attackerScore,
    defenderScore,
    judgment,
    reasoning
  };
}

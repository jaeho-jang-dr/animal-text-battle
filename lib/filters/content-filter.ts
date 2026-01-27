import { FilterResult } from '../../types';

// 욕설 필터 (아동 친화적 필터)
const profanityList = [
  // 한국어 욕설
  '시발', '씨발', '씨팔', 'ㅅㅂ', 'ㅆㅂ', '개새끼', '개새', '새끼', 'ㅅㄲ',
  '병신', '븅신', 'ㅂㅅ', '멍청이', '바보', '또라이', '미친', '죽어', '꺼져',
  '닥쳐', '짜증', '재수없', '지랄', 'ㅈㄹ', '방구', '찌질',

  // 영어 욕설
  'fuck', 'shit', 'damn', 'bitch', 'bastard',
  'stupid', 'idiot', 'dumb', 'moron', 'retard', 'die', 'kill',

  // 변형된 형태들
  'ㅅ1발', '시1발', 'tlqkf', 'tlfqkf', 'ㅄ', 'ㅂ1ㅅ', '병1신'
];

// 10계명 관련 위반 단어들 (종교적 모독)
const tenCommandmentsList = [
  // 신성모독
  '하나님', '하느님', '예수', '그리스도', '성령', '삼위일체', '여호와', '야훼',
  'god', 'jesus', 'christ', 'lord',

  // 살인/폭력 관련
  '살인', '자살', '목매', '폭행', '구타',
  'murder', 'suicide', 'blood', 'weapon',

  // 도둑질 관련
  '훔치', '도둑', '절도', '강도', 'steal', 'thief', 'rob',

  // 거짓 증언
  '거짓말', '사기', '속이', '배신', 'lie', 'cheat', 'betray',

  // 간음 관련 (아동 부적절)
  '섹스', '성관계', '야동', '음란', 'sex', 'porn'
];

// 필터링 함수
export function filterContent(text: string): FilterResult {
  const lowerText = text.toLowerCase();
  const violations: string[] = [];
  let warningType: string | undefined;

  // 욕설 체크
  for (const profanity of profanityList) {
    if (lowerText.includes(profanity.toLowerCase())) {
      violations.push(`욕설 사용: ${profanity}`);
      warningType = 'profanity';
      break; // 첫 번째 위반만 기록
    }
  }

  // 10계명 위반 체크
  for (const word of tenCommandmentsList) {
    if (lowerText.includes(word.toLowerCase())) {
      violations.push(`부적절한 내용: ${word}`);
      warningType = warningType || 'ten_commandments';
      break; // 첫 번째 위반만 기록
    }
  }

  // 추가 패턴 체크
  // 반복된 특수문자
  if (/[!@#$%^&*()]{5,}/.test(text)) {
    violations.push('과도한 특수문자 사용');
    warningType = warningType || 'spam';
  }

  // 과도한 대문자
  if (text.length > 10 && text === text.toUpperCase() && /[A-Z]/.test(text)) {
    violations.push('과도한 대문자 사용');
    warningType = warningType || 'spam';
  }

  // 스팸성 반복
  const repeatedPattern = /(.)\1{9,}/;
  if (repeatedPattern.test(text)) {
    violations.push('스팸성 반복 문자');
    warningType = warningType || 'spam';
  }

  return {
    isClean: violations.length === 0,
    violations,
    warningType
  };
}

// 캐릭터 이름 필터 (더 엄격한 기준)
export function filterCharacterName(name: string): FilterResult {
  // 기본 필터링
  const basicFilter = filterContent(name);
  if (!basicFilter.isClean) {
    return basicFilter;
  }

  const violations: string[] = [];

  // 길이 체크
  if (name.length < 2 || name.length > 20) {
    violations.push('이름은 2-20자 사이여야 합니다');
  }

  // 특수문자 체크 (한글, 영문, 숫자, 공백만 허용)
  if (!/^[가-힣a-zA-Z0-9\s]+$/.test(name)) {
    violations.push('이름은 한글, 영문, 숫자만 사용 가능합니다');
  }

  // 연속 공백 체크
  if (/\s{2,}/.test(name)) {
    violations.push('연속된 공백은 사용할 수 없습니다');
  }

  return {
    isClean: violations.length === 0,
    violations,
    warningType: violations.length > 0 ? 'invalid_format' : undefined
  };
}

// 배틀 텍스트 필터 (100자 제한 포함)
export function filterBattleText(text: string): FilterResult {
  // 기본 필터링
  const basicFilter = filterContent(text);
  if (!basicFilter.isClean) {
    return basicFilter;
  }

  const violations: string[] = [];

  // 길이 체크
  if (text.length === 0) {
    violations.push('배틀 텍스트를 입력해주세요');
  } else if (text.length > 100) {
    violations.push('배틀 텍스트는 100자를 초과할 수 없습니다');
  }

  // 최소 의미있는 글자 체크
  const meaningfulText = text.replace(/[\s\n\r\t]/g, '');
  if (meaningfulText.length < 10) {
    violations.push('최소 10자 이상의 의미있는 텍스트를 입력해주세요');
  }

  return {
    isClean: violations.length === 0,
    violations,
    warningType: violations.length > 0 ? 'invalid_format' : undefined
  };
}

// 이메일 필터
export function filterEmail(email: string): FilterResult {
  const violations: string[] = [];

  // 이메일 형식 체크
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    violations.push('올바른 이메일 형식이 아닙니다');
  }

  // 금지된 도메인 체크 (일회용 이메일 등)
  const blockedDomains = [
    'tempmail', 'throwaway', '10minutemail', 'guerrillamail',
    'mailinator', 'maildrop', 'mintemail', 'trashmail'
  ];

  const domain = email.split('@')[1]?.toLowerCase() || '';
  if (blockedDomains.some(blocked => domain.includes(blocked))) {
    violations.push('사용할 수 없는 이메일 도메인입니다');
  }

  return {
    isClean: violations.length === 0,
    violations,
    warningType: violations.length > 0 ? 'invalid_email' : undefined
  };
}
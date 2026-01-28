import { describe, it, expect } from 'vitest';
import { 
  filterContent, 
  filterCharacterName, 
  filterBattleText, 
  filterEmail 
} from './content-filter';

describe('Content Filter', () => {
  describe('filterContent', () => {
    it('should pass clean text', () => {
      const result = filterContent('안녕하세요, 즐거운 게임입니다.');
      expect(result.isClean).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect Korean profanity', () => {
      const result = filterContent('야 이 개새끼야');
      expect(result.isClean).toBe(false);
      expect(result.violations[0]).toContain('욕설 사용');
    });

    it('should detect English profanity', () => {
      const result = filterContent('This is stupid');
      expect(result.isClean).toBe(false);
      expect(result.violations[0]).toContain('욕설 사용');
    });

    it('should detect Ten Commandments violations', () => {
      const result = filterContent('나는 신이다'); // "신" itself might not be filtered but let's check the list
      // List includes '하나님', '예수' etc.
      const result2 = filterContent('예수쟁이');
      expect(result2.isClean).toBe(false);
      expect(result2.violations[0]).toContain('부적절한 내용');
    });

    it('should detect excessive special characters', () => {
      const result = filterContent('안녕!!!!!!');
      expect(result.isClean).toBe(false);
      expect(result.violations[0]).toContain('과도한 특수문자');
    });

    it('should detect spammy repetition', () => {
      const result = filterContent('아아아아아아아아아아');
      expect(result.isClean).toBe(false);
      expect(result.violations[0]).toContain('스팸성 반복');
    });
  });

  describe('filterCharacterName', () => {
    it('should pass valid names', () => {
      const result = filterCharacterName('멋진사자');
      expect(result.isClean).toBe(true);
    });

    it('should reject names too short', () => {
      const result = filterCharacterName('사');
      expect(result.isClean).toBe(false);
      expect(result.violations).toContain('이름은 2-20자 사이여야 합니다');
    });

    it('should reject special characters', () => {
      const result = filterCharacterName('사자!');
      expect(result.isClean).toBe(false);
      expect(result.violations).toContain('이름은 한글, 영문, 숫자만 사용 가능합니다');
    });

    it('should fail if content filter fails', () => {
      const result = filterCharacterName('개새끼');
      expect(result.isClean).toBe(false);
      expect(result.violations[0]).toContain('욕설 사용');
    });
  });

  describe('filterBattleText', () => {
    it('should pass valid battle text', () => {
      const result = filterBattleText('강력한 앞발로 상대를 내리칩니다!');
      expect(result.isClean).toBe(true);
    });

    it('should reject text too short', () => {
      const result = filterBattleText('공격');
      expect(result.isClean).toBe(false);
      expect(result.violations).toContain('최소 10자 이상의 의미있는 텍스트를 입력해주세요');
    });

    it('should reject text exceeding 100 chars', () => {
      // Use non-repeating text to avoid triggering spam filter
      const longText = '안녕하세요 저는 테스트를 위해 작성된 아주 긴 문장입니다. 이 문장은 백 글자를 넘겨야 하기 때문에 계속해서 말을 이어가고 있습니다. 하나 둘 셋 넷 다섯 여섯 일곱 여덟 아홉 열. 이제 백자가 넘었을까요?'.repeat(2);
      const result = filterBattleText(longText);
      expect(result.isClean).toBe(false);
      expect(result.violations).toContain('배틀 텍스트는 100자를 초과할 수 없습니다');
    });
  });

  describe('filterEmail', () => {
    it('should pass valid email', () => {
      const result = filterEmail('test@example.com');
      expect(result.isClean).toBe(true);
    });

    it('should reject invalid format', () => {
      const result = filterEmail('invalid-email');
      expect(result.isClean).toBe(false);
      expect(result.violations).toContain('올바른 이메일 형식이 아닙니다');
    });

    it('should reject disposable domains', () => {
      const result = filterEmail('user@tempmail.com');
      expect(result.isClean).toBe(false);
      expect(result.violations).toContain('사용할 수 없는 이메일 도메인입니다');
    });
  });
});

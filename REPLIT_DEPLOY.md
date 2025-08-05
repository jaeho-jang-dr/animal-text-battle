# 🚀 Replit 배포 가이드

## 자동 배포 준비 완료!

모든 Replit 배포 설정이 완료되었습니다. 다음 단계만 따라하시면 됩니다:

## 📋 배포 단계

### 1. GitHub에 코드 푸시
```bash
git add .
git commit -m "feat: Replit 배포 설정 완료"
git push origin main
```

### 2. Replit에서 Import
1. [Replit.com](https://replit.com) 로그인
2. "Create Repl" 클릭
3. "Import from GitHub" 선택
4. 저장소 URL 입력: `https://github.com/jaeho-jang-dr/animal-text-battle`
5. "Import" 클릭

### 3. Secrets 설정 (중요!)
Replit의 Secrets 탭에서 다음 환경 변수 추가:

```
JWT_SECRET = [32자 이상 랜덤 문자열]
SESSION_SECRET = [32자 이상 랜덤 문자열]
ADMIN_USERNAME = admin
ADMIN_PASSWORD = [안전한 비밀번호]
```

### 4. 실행
"Run" 버튼을 클릭하면 자동으로:
- 의존성 설치
- 빌드 실행
- 서버 시작

## ✅ 완료된 설정

### 파일 구조
- ✅ `.replit` - Replit 실행 설정
- ✅ `replit.nix` - 시스템 의존성 (SQLite 포함)
- ✅ `.env.replit` - 환경 변수 템플릿
- ✅ `lib/db-replit.ts` - Replit 최적화 DB 설정
- ✅ `scripts/replit-setup.js` - 초기 설정 스크립트
- ✅ `next.config.js` - Replit 호환 설정

### 최적화 내용
- ✅ SQLite 데이터베이스 (영속 저장소)
- ✅ 메모리 사용 최적화
- ✅ 포트 3008 자동 설정
- ✅ SWC 비활성화 (호환성)
- ✅ 빌드 에러 무시 설정

## 🎯 배포 후 확인사항

1. **URL 형식**: `https://[repl-name].[username].repl.co`
2. **데이터베이스**: `/home/runner/[repl-name]/data/kid-text-battle.db`
3. **로그**: Replit 콘솔에서 실시간 확인

## ⚠️ 주의사항

1. **무료 티어 제한**
   - RAM: 512MB
   - 스토리지: 1GB
   - 항상 켜짐: 없음 (접속 시 시작)

2. **성능 팁**
   - 이미지는 CDN 사용 권장
   - 대용량 파일 업로드 제한
   - 동시 접속자 많을 시 유료 플랜 고려

## 🆘 문제 해결

### "Module not found" 에러
```bash
rm -rf node_modules package-lock.json
npm install
```

### 포트 에러
이미 설정됨 (PORT=3008)

### 메모리 부족
`.replit` 파일에서:
```
run = "node --max-old-space-size=450 .next/standalone/server.js"
```

## 🎉 완료!

이제 Replit에서 앱이 실행됩니다. 
문제가 있으면 Replit 콘솔 로그를 확인하세요.
# Kid Text Battle - SQLite to PostgreSQL 마이그레이션 요약

## 🎯 마이그레이션 완료 상태

### ✅ 완료된 작업

1. **PostgreSQL 클라이언트 설치**
   - `@neondatabase/serverless` 패키지 추가
   - `better-sqlite3` 제거

2. **데이터베이스 모듈 생성**
   - `/lib/postgres-db.ts` - PostgreSQL 연결 및 쿼리 처리
   - `/lib/db.ts` - SQLite 호환 인터페이스 제공

3. **스키마 마이그레이션**
   - `/scripts/migrate-to-postgres.sql` - 전체 스키마 및 초기 데이터
   - UUID 확장, 인덱스, 뷰 포함

4. **API 라우트 비동기화**
   - 23개 API 라우트를 async/await로 변환
   - 데이터베이스 쿼리 비동기 처리
   - 활동 추적 함수 비동기화

5. **환경 설정**
   - `.env.example` - 환경 변수 템플릿
   - `vercel.json` - Vercel 배포 설정
   - 배포 가이드 문서 작성

## 📋 주요 변경사항

### 데이터베이스 쿼리

- **이전**: `db.prepare().get()` (동기)
- **이후**: `await db.prepare().get()` (비동기)

### 데이터 타입

- **TEXT** → UUID (id 필드)
- **INTEGER** → BOOLEAN
- **AUTOINCREMENT** → SERIAL
- **datetime()** → TIMESTAMP 함수

### 플레이스홀더

- SQLite `?` → 자동으로 PostgreSQL `$n`으로 변환

## 🚀 배포 단계

1. **Neon.tech 계정 생성**

   ```
   https://neon.tech
   ```

2. **데이터베이스 생성 후 연결 문자열 복사**

   ```
   postgresql://username:password@host/database?sslmode=require
   ```

3. **환경 변수 설정**

   ```bash
   # .env.local
   # Firebase Configuration

NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyC4nvXOBEOV-cfzAG8DJhWhcQpj6g94dAs"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="animal-text-battle.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="animal-text-battle"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="animal-text-battle.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="243991790292"
NEXT_PUBLIC_FIREBASE_APP_ID="1:243991790292:web:c9caa2e206f21a749bb141"
FIREBASE_SERVICE_ACCOUNT={
  "type": "service_account",
  "project_id": "animal-text-battle",
  "private_key_id": "YOUR_PRIVATE_KEY_ID_HERE",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n",
  "client_email": "<firebase-adminsdk-fbsvc@animal-text-battle.iam.gserviceaccount.com>",
  "client_id": "YOUR_CLIENT_ID_HERE",
  "auth_uri": "<https://accounts.google.com/o/oauth2/auth>",
  "token_uri": "<https://oauth2.googleapis.com/token>",
  "auth_provider_x509_cert_url": "<https://www.googleapis.com/oauth2/v1/certs>",
  "client_x509_cert_url": "YOUR_CERT_URL_HERE",
  "universe_domain": "googleapis.com"
}

1. **데이터베이스 초기화**

   ```bash
   npm run db:init
   ```

2. **Vercel 배포**

   ```bash
   vercel --prod
   ```

## ⚠️ 주의사항

1. **환경 변수**: Vercel 대시보드에서 반드시 설정
2. **SSL 모드**: PostgreSQL 연결 시 `sslmode=require` 필수
3. **타임존**: UTC 사용 (CURRENT_TIMESTAMP)
4. **트랜잭션**: Neon은 서버리스라 트랜잭션 제한 있음

## 📁 파일 구조

```
kid-text-battle/
├── lib/
│   ├── db.ts                 # SQLite 호환 인터페이스
│   ├── postgres-db.ts        # PostgreSQL 연결
│   └── activity-tracker.ts   # 비동기 활동 추적
├── scripts/
│   ├── migrate-to-postgres.sql  # 스키마 및 데이터
│   └── init-postgres.js         # 초기화 스크립트
├── docs/
│   └── VERCEL_DEPLOYMENT_GUIDE.md  # 상세 배포 가이드
├── .env.example              # 환경 변수 템플릿
└── vercel.json              # Vercel 설정
```

## 🧪 테스트 체크리스트

- [ ] 로그인 (게스트/이메일)
- [ ] 캐릭터 생성
- [ ] 배틀 텍스트 수정
- [ ] 배틀 진행
- [ ] 리더보드 조회
- [ ] 배틀 히스토리
- [ ] 관리자 패널

## 🔗 관련 문서

- [상세 배포 가이드](/docs/VERCEL_DEPLOYMENT_GUIDE.md)
- [Neon.tech 문서](https://neon.tech/docs)
- [Vercel 문서](https://vercel.com/docs)

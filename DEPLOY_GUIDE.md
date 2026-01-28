# Vercel 배포 가이드

이 앱을 Vercel에 배포하기 위한 단계입니다.

## 1. 깃허브 푸시 완료
현재 코드는 `jaeho-jang-dr/animal-text-battle` 리포지토리에 최산 상태로 저장(Push)되었습니다.

## 2. Vercel 프로젝트 생성
1. [Vercel 대시보드](https://vercel.com/dashboard)로 이동합니다.
2. **"Add New..."** -> **"Project"** 클릭.
3. Import Git Repository에서 `animal-text-battle`을 찾아 **Import**를 누릅니다.

## 3. 환경 변수 설정 (중요!)
Deploy하기 전에 **"Environment Variables"** 섹션을 펼쳐 다음 값들을 입력해야 합니다.
(`.env.local` 파일의 내용을 복사해서 넣으세요)

| Key | Value (예시) |
|-----|--------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | AIzaSy... |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | sesame-ramyun-yoohoo-v1.firebaseapp.com |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | sesame-ramyun-yoohoo-v1 |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | sesame-ramyun-yoohoo-v1.firebasestorage.app |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | 855063820045 |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | 1:855063820045:web:... |
| `GEMINI_API_KEY` | AIzaSyDI5QlK-PA29INcOnmNjprALoRw0vkoYmY |

> **팁:** `.env.local` 파일의 내용을 텍스트로 보거나 복사하려면 에디터에서 파일을 여세요.

## 4. 배포 (Deploy)
설정이 끝났으면 **"Deploy"** 버튼을 누르세요.
잠시 후 배포가 완료되면 전 세계 어디서나 접속 가능한 URL이 생성됩니다! 🚀

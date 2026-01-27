# Firebase 설정 문제 해결 가이드

## 🚨 게스트 로그인이 안 되나요?

현재 서버(데이터베이스) 연결은 성공했지만, **로그인 기능**에서 문제가 발생하고 있습니다.
`auth/admin-restricted-operation` 에러는 **Firebase 콘솔에서 '익명 로그인'이 꺼져있을 때** 발생합니다.

### 1단계: 익명 로그인 활성화 확인

1. [Firebase Console](https://console.firebase.google.com/) 접속
2. `animal-text-battle` 프로젝트 선택
3. 왼쪽 메뉴 **빌드 (Build)** -> **Authentication** 클릭
4. **Sign-in method** 탭 클릭
5. **익명 (Anonymous)** 제공업체가 **'사용 설정됨(Enabled)'** 상태인지 확인하세요.
   * 만약 '사용 중지됨'이라면 클릭해서 **사용 설정** 스위치를 켜고 **저장(Save)** 버튼을 꼭 눌러주세요!

### 2단계: 프로젝트 설정 확인

만약 위 설정이 되어있는데도 안 된다면, 로컬 설정 파일(`.env.local`)의 API 키가 실제 프로젝트와 다를 수 있습니다.

1. Firebase Console > **프로젝트 설정 (Project Settings)** (왼쪽 상단 톱니바퀴)
2. **내 앱 (Your apps)** 영역으로 스크롤 내리기
3. **SDK 설정 및 구성 (SDK setup and configuration)**에서 `Config` 선택
4. 나타나는 코드에서 `apiKey`, `authDomain`, `projectId` 등을 복사하여
5. 로컬의 `.env.local` 파일 내용과 일치하는지 확인해 주세요.

---

### 서버 상태

* **Firestore**: ✅ 연결됨 (정상)
* **Authentication**: ❌ 실패 (설정 필요)

설정을 확인하시고 저장하셨다면, 브라우저를 **새로고침**해서 다시 시도해 주세요!

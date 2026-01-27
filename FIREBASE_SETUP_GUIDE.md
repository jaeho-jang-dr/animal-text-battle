# Firebase 프로젝트 필수 설정 가이드

앱이 정상적으로 작동하려면 Firebase 콘솔에서 다음 2가지 설정이 반드시 필요합니다.
현재 발생한 에러(`7 PERMISSION_DENIED`)는 **Firestore 데이터베이스가 생성되지 않아서** 발생하는 문제입니다.

---

## 1. 🗄️ Firestore 데이터베이스 생성 (가장 중요)

이 단계를 진행해야 '캐릭터 생성'시 발생하는 에러가 해결됩니다.

1. [Firebase Console](https://console.firebase.google.com/)에 접속하여 `animal-text-battle` 프로젝트를 선택합니다.
2. 왼쪽 메뉴에서 **빌드 (Build)** > **Firestore Database**를 클릭합니다.
3. **"데이터베이스 만들기 (Create Database)"** 버튼을 클릭합니다.
4. **위치 선택**: `asia-northeast3` (Seoul) 또는 `us-central1`을 선택합니다.
5. **보안 규칙**: **'테스트 모드에서 시작 (Start in test mode)'**를 선택하고 **만들기**를 클릭합니다.
   - (앱에서 이미 Admin SDK를 사용하므로 보안 규칙과 상관없이 작동하지만, 초기 설정을 위해 테스트 모드가 편합니다.)

---

## 2. 🔐 인증(Authentication) 설정

'게스트 로그인'이 안 되는 문제를 해결하기 위해 필요합니다.

1. 왼쪽 메뉴에서 **빌드 (Build)** > **Authentication**을 클릭합니다.
2. **"시작하기 (Get started)"**를 클릭합니다.
3. **Sign-in method** 탭으로 이동합니다.
4. **새 제공업체 추가**에서 **익명 (Anonymous)**을 찾아 **사용 설정(Enable)** 후 저장합니다.
5. (선택사항) **Google**도 사용하려면 추가하고 설정합니다.

---

## 3. ✅ 확인

설정이 완료되면 로컬 앱(`http://localhost:3009`)에서 다시 시도해 보세요.

1. 새로고침 (F5)
2. **게스트로 체험하기** 클릭 -> 로그인 성공 확인
3. **캐릭터 생성** 다시 시도

설정이 완료되면 말씀해 주시면, 바로 다음 단계로 넘어가겠습니다! 🚀

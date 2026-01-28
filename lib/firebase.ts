import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock-project.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock-project.firebasestorage.app",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "00000000000",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:00000000000:web:000000000000"
};

// Runtime Check for Environment Variables
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    if (firebaseConfig.apiKey?.startsWith('mock')) {
        console.error("CRITICAL: Running in PRODUCTION with MOCK config!");
        // setTimeout to ensure it runs after hydration
        setTimeout(() => {
            alert("⚠️ 중대한 설정 오류:\nFirebase 환경 변수가 적용되지 않아 '로그인'이 불가능합니다.\n관리자에게 Vercel 환경 변수 설정을 요청하세요.");
        }, 1000);
    }
}

console.log("Firebase Config Status:", {
    apiKeyPresent: !firebaseConfig.apiKey?.startsWith('mock'),
    projectId: firebaseConfig.projectId
});

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };

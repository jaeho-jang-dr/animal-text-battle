import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = (() => {
    try {
        return process.env.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : undefined;
    } catch (e) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT:', e);
        return undefined;
    }
})();

// Initialize Firebase Admin
if (!getApps().length) {
    if (serviceAccount) {
        initializeApp({
            credential: cert(serviceAccount)
        });
    } else {
        // Fallback for development if no service account (might fail some ops)
        // Or warn the user
        console.warn("FIREBASE_SERVICE_ACCOUNT not set. Admin SDK might fail.");
        initializeApp();
    }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

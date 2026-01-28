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

// Safe export for adminAuth and adminDb
let adminAuth: any;
let adminDb: any;

try {
    if (getApps().length) {
        adminAuth = getAuth();
        adminDb = getFirestore();
    } else if (serviceAccount) {
        // ... previously initialized
        adminAuth = getAuth();
        adminDb = getFirestore();
    } else {
        // Force init with default if possible, or Mock
        // If we are in build environment without creds, Mock it.
        if (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_SERVICE_ACCOUNT) {
            console.warn("Building without FIREBASE_SERVICE_ACCOUNT. Mocking Admin SDK.");
            adminDb = {
                collection: () => ({
                    doc: () => ({
                        get: async () => ({ exists: false, data: () => ({}) }),
                        set: async () => { },
                        update: async () => { },
                        delete: async () => { },
                    }),
                    where: () => ({ get: async () => ({ empty: true, docs: [] }) }),
                })
            };
            adminAuth = {
                getUser: async () => ({}),
                verifyIdToken: async () => ({ uid: 'mock' })
            };
        } else {
            // Try to initialize mostly for dev
            initializeApp();
            adminAuth = getAuth();
            adminDb = getFirestore();
        }
    }
} catch (e) {
    console.warn("Firebase Admin Init Failed:", e);
    // Mock to prevent build crash
    adminDb = {
        collection: () => ({
            doc: () => ({
                get: async () => ({ exists: false }),
            })
        })
    };
}

export { adminAuth, adminDb };

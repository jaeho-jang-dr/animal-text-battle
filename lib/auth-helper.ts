import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin';

export async function verifyUser(request: NextRequest) {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return null;
    try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        return decodedToken;
    } catch (e) {
        console.error("Token verification failed", e);
        return null;
    }
}

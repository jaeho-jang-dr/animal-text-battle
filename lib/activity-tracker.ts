import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function updateUserActivity(userId: string) {
  try {
    // 사용자의 마지막 로그인 시간 업데이트
    await adminDb.collection('users').doc(userId).update({
      lastLogin: FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Activity update error:', error);
  }
}

export async function logUserAction(userId: string, action: string, details?: any) {
  try {
    // 사용자 활동 로그 (admin_logs 컬렉션 활용)
    await adminDb.collection('admin_logs').add({
      adminId: userId, // Assuming current user is the actor
      actionType: action,
      targetType: 'user_action',
      details: details || {},
      createdAt: FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Action logging error:', error);
  }
}

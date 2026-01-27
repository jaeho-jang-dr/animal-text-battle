import { adminDb } from './firebase-admin';

// 설정값 캐시
let settingsCache: { [key: string]: any } = {};
let cacheTimestamp = 0;
const CACHE_DURATION = 60000; // 1분 캐시

// 설정값 조회 함수
export async function getSetting(key: string, defaultValue?: any): Promise<any> {
  const now = Date.now();

  // 캐시가 유효한 경우
  if (settingsCache[key] !== undefined && now - cacheTimestamp < CACHE_DURATION) {
    return settingsCache[key];
  }

  try {
    // Use 'settings' or 'admin_settings' collection. Let's use 'settings' for simplicity or stick to 'admin_settings' to match SQL table name concept.
    // Let's use 'admin_settings' as collection name.
    const doc = await adminDb.collection('admin_settings').doc(key).get();

    if (doc.exists) {
      const data = doc.data();
      const value = data?.value; // Assume field is 'value'

      // If value is undefined in doc, return default?
      // Check if value needs parsing? Firestore stores types, so often no parsing needed if stored correctly.
      // But if we store everything as string... let's assume robust handling.

      if (value === undefined) return defaultValue;

      settingsCache[key] = value;
      return value;
    }
  } catch (error) {
    console.error(`Failed to get setting ${key}:`, error);
  }

  return defaultValue;
}

// 설정값 캐시 무효화
export function invalidateSettingsCache() {
  settingsCache = {};
  cacheTimestamp = 0;
}

// 여러 설정값 한번에 조회
export async function getSettings(keys: string[]): Promise<{ [key: string]: any }> {
  const results: { [key: string]: any } = {};

  // Parallel fetch could be better but reusing getSetting for cache logic
  await Promise.all(keys.map(async (key) => {
    results[key] = await getSetting(key);
  }));

  return results;
}

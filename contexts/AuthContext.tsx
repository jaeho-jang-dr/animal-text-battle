'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  signInAnonymously,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User } from '../types'; // Keep existing type for app compatibility, but map from Firebase

interface AuthContextType {
  user: User | null; // App's User type
  firebaseUser: FirebaseUser | null; // Raw Firebase User
  isLoading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Public paths
  const publicPaths = ['/', '/animals', '/leaderboard', '/text-guide'];
  const authRequiredPaths = ['/play', '/create-character'];

  useEffect(() => {
    // Enable offline persistence
    setPersistence(auth, browserLocalPersistence)
      .catch((error) => {
        console.error("Auth persistence error:", error);
      });

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);

      if (fbUser) {
        // Optimistic UI: Set user immediately with basic info
        const baseUser: User = {
          id: fbUser.uid,
          email: fbUser.email || undefined,
          display_name: fbUser.displayName || `User_${fbUser.uid.slice(0, 5)}`,
          is_guest: fbUser.isAnonymous,
          created_at: new Date().toISOString(),
          token_expires_at: '',
          login_token: ''
        };

        // Unblock UI immediately
        setUser(baseUser);
        setIsLoading(false);

        // Sync with Firestore in background
        try {
          const userRef = doc(db, 'users', fbUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            // Update with full data when available
            setUser(prev => ({ ...baseUser, ...userSnap.data() } as User));
          } else {
            // Create record silently
            try {
              await setDoc(userRef, {
                ...baseUser,
                last_login: serverTimestamp()
              });
            } catch (writeError) {
              console.warn("Background persistence failed (non-critical):", writeError);
            }
          }
        } catch (error) {
          console.warn("Background user sync warning:", error);
        }
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Route protection
  useEffect(() => {
    if (!isLoading) {
      const isPublicPath = publicPaths.includes(pathname);
      const requiresAuth = authRequiredPaths.some(path => pathname.startsWith(path));

      if (requiresAuth && !user) {
        router.push('/');
      }
      // Removed automatic redirect from / to /play to show landing page
      else if (pathname === '/' && user) {
        // Only redirect if there was a specific target stored (e.g. from a deep link protected route)
        const redirectTarget = localStorage.getItem('auth_redirect');
        if (redirectTarget) {
          localStorage.removeItem('auth_redirect');
          router.push(redirectTarget);
        }
        // Otherwise do nothing, let them see the landing page
      }
    }
  }, [pathname, user, isLoading]);

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signupWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const guestLogin = async () => {
    await signInAnonymously(auth);
  };

  const logout = async () => {
    await signOut(auth);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      isLoading,
      loginWithEmail,
      signupWithEmail,
      loginWithGoogle,
      guestLogin,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

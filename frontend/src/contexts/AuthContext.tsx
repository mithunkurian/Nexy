"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  collection,
  query,
  limit,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfile, Role } from "@/types/auth";

// ─── Context shape ────────────────────────────────────────────────────────────
interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  role: Role | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Clean up previous profile listener if user changed
      profileUnsub?.();
      profileUnsub = null;

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(firebaseUser);
      const ref = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        // First sign-in for this user — determine role
        try {
          const anyUser = await getDocs(query(collection(db, "users"), limit(1)));
          const role: Role = anyUser.empty ? "admin" : "pending";
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? "",
            displayName: firebaseUser.displayName ?? firebaseUser.email ?? "User",
            photoURL: firebaseUser.photoURL,
            role,
            disabled: false,
            createdAt: Date.now(),
          };
          await setDoc(ref, newProfile);
        } catch (err) {
          console.error("Failed to create user profile in Firestore:", err);
          // Fall back: treat as pending so the app doesn't hang
          setProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email ?? "",
            displayName: firebaseUser.displayName ?? "",
            photoURL: firebaseUser.photoURL,
            role: "pending",
            disabled: false,
            createdAt: Date.now(),
          });
          setLoading(false);
          return;
        }
      }

      // Live subscription — admin role changes propagate instantly
      profileUnsub = onSnapshot(ref, (s) => {
        if (s.exists()) {
          setProfile(s.data() as UserProfile);
        }
        setLoading(false);
      });
    });

    return () => {
      authUnsub();
      profileUnsub?.();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role ?? null,
        loading,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useAuth() {
  return useContext(AuthContext);
}

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
  type DocumentData,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { AllowedUser, UserProfile } from "@/types/auth";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  role: UserProfile["role"] | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  authError: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

function toUserProfile(data: DocumentData): UserProfile {
  return {
    uid: data.uid,
    email: data.email,
    displayName: data.displayName,
    photoURL: data.photoURL ?? null,
    role: data.role,
    disabled: Boolean(data.disabled),
    createdAt: data.createdAt ?? Date.now(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      profileUnsub?.();
      profileUnsub = null;

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setAuthError(null);

      try {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const normalizedEmail = normalizeEmail(firebaseUser.email);
          const allowedRef = doc(db, "allowedUsers", normalizedEmail);
          const allowedSnap = await getDoc(allowedRef);

          if (!allowedSnap.exists()) {
            setAuthError("This Google account is not approved for this Nexy home.");
            await fbSignOut(auth);
            setLoading(false);
            return;
          }

          const invite = allowedSnap.data() as AllowedUser;
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: normalizedEmail,
            displayName: firebaseUser.displayName ?? firebaseUser.email ?? "User",
            photoURL: firebaseUser.photoURL,
            role: invite.role,
            disabled: false,
            createdAt: Date.now(),
          };
          await setDoc(userRef, newProfile);
          await setDoc(allowedRef, { ...invite, claimedByUid: firebaseUser.uid }, { merge: true });
        }

        profileUnsub = onSnapshot(userRef, (snap) => {
          if (!snap.exists()) {
            setProfile(null);
            setAuthError("Your Nexy access record is missing. Contact the admin.");
          } else {
            setUser(firebaseUser);
            setProfile(toUserProfile(snap.data()));
          }
          setLoading(false);
        });
      } catch (err) {
        console.error("Failed to load Nexy auth profile:", err);
        setAuthError("Could not verify your Nexy access right now.");
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      profileUnsub?.();
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    setAuthError(null);
    await signInWithPopup(auth, provider);
  }, []);

  const signOut = useCallback(async () => {
    setAuthError(null);
    await fbSignOut(auth);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role: profile?.role ?? null,
        loading,
        authError,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

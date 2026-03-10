"use client";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  type AppSettings,
  type HomeSettings,
  type UserSettings,
  DEFAULT_HOME_SETTINGS,
  DEFAULT_SETTINGS,
  DEFAULT_USER_SETTINGS,
  loadSettings,
  saveSettings,
  mergeSettings,
  splitSettings,
  pickHomePatch,
  pickUserPatch,
} from "@/lib/settings";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useAuth } from "./AuthContext";

const HOME_SETTINGS_REF = () => doc(db, "homeSettings", "main");
const USER_SETTINGS_REF = (uid: string) => doc(db, "userSettings", uid);

interface SettingsContextValue {
  settings: AppSettings;
  homeSettings: HomeSettings;
  userSettings: UserSettings;
  hydrated: boolean;
  synced: boolean;
  update: (patch: Partial<AppSettings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  homeSettings: DEFAULT_HOME_SETTINGS,
  userSettings: DEFAULT_USER_SETTINGS,
  hydrated: false,
  synced: false,
  update: () => {},
  reset: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { role, user } = useAuth();
  const [homeSettings, setHomeSettings] = useState<HomeSettings>(DEFAULT_HOME_SETTINGS);
  const [userSettings, setUserSettings] = useState<UserSettings>(DEFAULT_USER_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    const local = loadSettings();
    const split = splitSettings(local);
    setHomeSettings(split.home);
    setUserSettings(split.user);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const unsubs: Array<() => void> = [];
    let homeReady = false;
    let userReady = !user;

    const markSynced = () => {
      if (homeReady && userReady) setSynced(true);
    };

    unsubs.push(onSnapshot(
      HOME_SETTINGS_REF(),
      (snap) => {
        if (snap.exists()) {
          setHomeSettings({ ...DEFAULT_HOME_SETTINGS, ...snap.data() });
        } else if (auth.currentUser && role === "admin") {
          setDoc(HOME_SETTINGS_REF(), homeSettings).catch(console.error);
        }
        homeReady = true;
        markSynced();
      },
      (err) => {
        console.warn("Home settings sync unavailable, using local cache:", err.message);
        homeReady = true;
        markSynced();
      },
    ));

    if (user) {
      unsubs.push(onSnapshot(
        USER_SETTINGS_REF(user.uid),
        (snap) => {
          if (snap.exists()) {
            setUserSettings({ ...DEFAULT_USER_SETTINGS, ...snap.data() });
          } else if (auth.currentUser) {
            setDoc(USER_SETTINGS_REF(user.uid), userSettings).catch(console.error);
          }
          userReady = true;
          markSynced();
        },
        (err) => {
          console.warn("User settings sync unavailable, using local cache:", err.message);
          userReady = true;
          markSynced();
        },
      ));
    } else {
      setUserSettings(DEFAULT_USER_SETTINGS);
      userReady = true;
      markSynced();
    }

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, [hydrated, role, user]);

  const settings = useMemo(() => mergeSettings(homeSettings, userSettings), [homeSettings, userSettings]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("dark", "light");
    if (settings.theme === "dark") {
      html.classList.add("dark");
    } else if (settings.theme === "light") {
      html.classList.add("light");
    } else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      html.classList.add(mq.matches ? "dark" : "light");
    }
  }, [settings.theme]);

  const update = useCallback((patch: Partial<AppSettings>) => {
    const homePatch = pickHomePatch(patch);
    const userPatch = pickUserPatch(patch);

    if (Object.keys(homePatch).length > 0 && role === "admin") {
      setHomeSettings((prev) => {
        const next = { ...prev, ...homePatch };
        setDoc(HOME_SETTINGS_REF(), next).catch(console.error);
        return next;
      });
    }

    if (Object.keys(userPatch).length > 0) {
      setUserSettings((prev) => {
        const next = { ...prev, ...userPatch };
        if (user) setDoc(USER_SETTINGS_REF(user.uid), next).catch(console.error);
        return next;
      });
    }
  }, [role, user]);

  const reset = useCallback(() => {
    if (role === "admin") {
      setHomeSettings(DEFAULT_HOME_SETTINGS);
      setDoc(HOME_SETTINGS_REF(), DEFAULT_HOME_SETTINGS).catch(console.error);
    }
    setUserSettings(DEFAULT_USER_SETTINGS);
    if (user) setDoc(USER_SETTINGS_REF(user.uid), DEFAULT_USER_SETTINGS).catch(console.error);
  }, [role, user]);

  return (
    <SettingsContext.Provider
      value={{ settings, homeSettings, userSettings, hydrated, synced, update, reset }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

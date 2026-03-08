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
  type AppSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  migrateRaw,
} from "@/lib/settings";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

// Firestore document that holds all settings (one doc for the whole home)
const SETTINGS_REF = () => doc(db, "settings", "main");

interface SettingsContextValue {
  settings: AppSettings;
  hydrated: boolean;   // true once localStorage has been read
  synced: boolean;     // true once Firestore has responded (or failed gracefully)
  update: (patch: Partial<AppSettings>) => void;
  reset: () => void;
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: DEFAULT_SETTINGS,
  hydrated: false,
  synced: false,
  update: () => {},
  reset: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    // ── Step 1: Load from localStorage immediately (fast) ────────────────────
    const local = loadSettings();
    setSettings(local);
    setHydrated(true);

    // ── Step 2: Subscribe to Firestore for live cross-device sync ────────────
    const ref = SETTINGS_REF();
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          // Remote settings exist — merge with defaults + run migrations and apply everywhere
          const remote = migrateRaw(snap.data() as Record<string, unknown>);
          setSettings(remote);
          saveSettings(remote); // keep localStorage in sync as a cache
        } else {
          // No Firestore doc yet — push local settings up to the cloud
          setDoc(ref, local).catch(console.error);
        }
        setSynced(true);
      },
      (err) => {
        // Firestore unavailable (offline, rules, etc.) — silently fall back to localStorage
        console.warn("Firestore sync unavailable, using localStorage:", err.message);
        setSynced(true);
      }
    );

    return unsub; // clean up listener on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Apply theme class to <html> ─────────────────────────────────────────────
  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove("dark", "light");
    if (settings.theme === "dark") {
      html.classList.add("dark");
    } else if (settings.theme === "light") {
      html.classList.add("light");
    } else {
      // system
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      html.classList.add(mq.matches ? "dark" : "light");
    }
  }, [settings.theme]);

  // ── update: write to localStorage + Firestore ───────────────────────────────
  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);                                    // localStorage (instant)
      setDoc(SETTINGS_REF(), next).catch(console.error);    // Firestore (cloud)
      return next;
    });
  }, []);

  // ── reset: restore defaults everywhere ──────────────────────────────────────
  const reset = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
    setSettings(DEFAULT_SETTINGS);
    setDoc(SETTINGS_REF(), DEFAULT_SETTINGS).catch(console.error);
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, hydrated, synced, update, reset }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}

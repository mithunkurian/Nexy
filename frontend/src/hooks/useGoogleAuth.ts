"use client";
import { useSyncExternalStore, useEffect, useCallback } from "react";

const SCOPE            = "https://www.googleapis.com/auth/calendar.readonly";
const REFRESH_BEFORE_MS = 5 * 60 * 1000;
const WAS_SIGNED_IN_KEY = "nexy_google_signed_in";
const SESSION_TOKEN_KEY = "nexy_gcal_token";  // survives F5 within the same tab

// ─── Module-level auth state (singletons) ────────────────────────────────────
// These are initialised once for the lifetime of the browser tab.
// Multiple useGoogleAuth instances share exactly the same state.

let sharedToken: string | null =
  typeof window !== "undefined" ? sessionStorage.getItem(SESSION_TOKEN_KEY) : null;
let sharedCalendars: GCalendar[] = [];
let sharedIsLoading = false;
let sharedError: string | null = null;

// One subscriber set drives ALL useSyncExternalStore snapshots
const subscribers = new Set<() => void>();

function notifyAll() { subscribers.forEach(fn => fn()); }
function subscribeAll(cb: () => void) {
  subscribers.add(cb);
  return () => subscribers.delete(cb);
}

// Snapshot functions — must be stable references (defined at module scope)
function getTokenSnapshot()     { return sharedToken;       }
function getCalendarsSnapshot() { return sharedCalendars;   }
function getLoadingSnapshot()   { return sharedIsLoading;   }
function getErrorSnapshot()     { return sharedError;       }

// ─── Module-level GIS singleton ───────────────────────────────────────────────
// initTokenClient is called AT MOST ONCE per page session.
// This prevents GIS internal state from being reset on every component mount.
let tokenClient: TokenClient | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let gisReady = false;  // true once initTokenClient() has run

function scheduleRefresh(expiresInSeconds: number) {
  if (refreshTimer) clearTimeout(refreshTimer);
  const delay = Math.max(0, expiresInSeconds * 1000 - REFRESH_BEFORE_MS);
  refreshTimer = setTimeout(() => {
    tokenClient?.requestAccessToken({ prompt: "" });
  }, delay);
}

async function fetchCalendarList(token: string) {
  try {
    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?minAccessRole=reader",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) return;
    const data = await res.json();
    sharedCalendars = (data.items ?? []).map((item: {
      id: string; summary?: string; primary?: boolean;
    }) => ({
      id: item.id,
      summary: item.summary ?? item.id,
      primary: item.primary ?? false,
    }));
    notifyAll();
  } catch { /* ignore */ }
}

function handleToken(response: TokenResponse) {
  sharedIsLoading = false;
  if (response.error) {
    // Keep WAS_SIGNED_IN_KEY — "Tap to reconnect" stays visible
    if (response.error !== "access_denied") {
      sharedError = "Could not connect — please try again.";
    }
    notifyAll();
    return;
  }
  sharedError = null;
  localStorage.setItem(WAS_SIGNED_IN_KEY, "1");
  sessionStorage.setItem(SESSION_TOKEN_KEY, response.access_token);
  sharedToken = response.access_token;
  notifyAll();
  fetchCalendarList(response.access_token);
  scheduleRefresh(response.expires_in);
}

function initGIS(clientId: string) {
  if (gisReady || !clientId) return;
  gisReady = true;

  function setupClient() {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: handleToken,
      error_callback: () => {
        sharedIsLoading = false;
        notifyAll();
        // Keep WAS_SIGNED_IN_KEY — user can still tap "Reconnect"
      },
    });
    // If token already in sessionStorage (F5 refresh), re-fetch calendar list
    if (sharedToken) fetchCalendarList(sharedToken);
  }

  if (window.google?.accounts) {
    setupClient();
    return;
  }

  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  script.onload = setupClient;
  document.head.appendChild(script);
}

// ─── Public interfaces ────────────────────────────────────────────────────────
export interface GCalendar {
  id: string;
  summary: string;
  primary: boolean;
}

export interface GoogleAuthState {
  isSignedIn: boolean;
  wasSignedIn: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  calendarList: GCalendar[];
  signIn: () => void;
  signOut: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGoogleAuth(): GoogleAuthState {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  // useSyncExternalStore reads module-level state with proper React tearing prevention
  const accessToken  = useSyncExternalStore(subscribeAll, getTokenSnapshot,     () => null);
  const calendarList = useSyncExternalStore(subscribeAll, getCalendarsSnapshot, () => []);
  const isLoading    = useSyncExternalStore(subscribeAll, getLoadingSnapshot,   () => false);
  const error        = useSyncExternalStore(subscribeAll, getErrorSnapshot,     () => null);

  // Ensure GIS is initialised once (safe to call from multiple components —
  // the gisReady guard prevents duplicate initialisation)
  useEffect(() => { initGIS(clientId); }, [clientId]);

  const signIn = useCallback(() => {
    if (!tokenClient) return;
    sharedIsLoading = true;
    sharedError = null;
    notifyAll();
    // prompt: '' skips consent screen if already granted; still works first-time
    tokenClient.requestAccessToken({ prompt: "" });
  }, []);

  const signOut = useCallback(() => {
    if (sharedToken) window.google?.accounts?.oauth2?.revoke(sharedToken);
    if (refreshTimer) clearTimeout(refreshTimer);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(WAS_SIGNED_IN_KEY);
    sharedToken = null;
    sharedCalendars = [];
    sharedError = null;
    notifyAll();
  }, []);

  return {
    isSignedIn:  accessToken !== null,
    wasSignedIn: typeof window !== "undefined" && localStorage.getItem(WAS_SIGNED_IN_KEY) !== null,
    isLoading,
    error,
    accessToken,
    calendarList,
    signIn,
    signOut,
  };
}

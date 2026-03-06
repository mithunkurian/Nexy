/**
 * Simple in-memory activity log stored in sessionStorage.
 * Records device state changes so the dashboard can show recent events.
 */

export interface ActivityEntry {
  id: string;
  timestamp: number; // ms since epoch
  icon: string;
  title: string;
  detail: string;
}

const KEY = "nexy_activity";
const MAX = 30;

export function getActivity(): ActivityEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function logActivity(entry: Omit<ActivityEntry, "id" | "timestamp">): void {
  if (typeof window === "undefined") return;
  const entries = getActivity();
  entries.unshift({
    ...entry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  });
  sessionStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX)));
  window.dispatchEvent(new Event("nexy_activity_update"));
}

export function formatRelative(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

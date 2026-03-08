export type Theme = "light" | "dark" | "system";
export type AccentColor = "blue" | "green" | "purple" | "amber";
export type AIProvider = "anthropic" | "openai" | "ollama";

export interface TransitRoute {
  id: string;           // unique key (crypto.randomUUID)
  fromStop: string;     // stop name to look up, e.g. "Storängsstigen (Huddinge)"
  toStop: string;       // destination label (display only), e.g. "Huddinge (Huddinge)"
  lineFilter: string;   // line number string to filter departures, e.g. "705"
}

export type CalendarColor = "rose" | "blue" | "green" | "violet" | "amber" | "teal";

export interface CalendarConfig {
  id: string;           // crypto.randomUUID()
  name: string;         // display label, e.g. "Mithun", "Priya"
  calendarId: string;   // Google Calendar ID (usually email)
  color: CalendarColor;
}

export const CALENDAR_COLORS: CalendarColor[] = ["rose", "blue", "green", "violet", "amber", "teal"];

export const CALENDAR_COLOR_MAP: Record<CalendarColor, { dot: string; text: string; border: string }> = {
  rose:   { dot: "bg-rose-400",    text: "text-rose-600 dark:text-rose-400",     border: "border-rose-300"   },
  blue:   { dot: "bg-blue-400",    text: "text-blue-600 dark:text-blue-400",     border: "border-blue-300"   },
  green:  { dot: "bg-emerald-400", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-300" },
  violet: { dot: "bg-violet-400",  text: "text-violet-600 dark:text-violet-400", border: "border-violet-300" },
  amber:  { dot: "bg-amber-400",   text: "text-amber-600 dark:text-amber-400",   border: "border-amber-300"  },
  teal:   { dot: "bg-teal-400",    text: "text-teal-600 dark:text-teal-400",     border: "border-teal-300"   },
};

export interface AppSettings {
  // Identity
  ownerName: string;
  homeName: string;
  address: string;

  // Appearance
  theme: Theme;
  accentColor: AccentColor;

  // Connection
  backendUrl: string;
  wsUrl: string;
  aiProvider: AIProvider;

  // Commute & Live Info
  transitRoutes: TransitRoute[];   // Configured commute routes with line filters
  trafiklabApiKey: string;         // Free key from trafiklab.se (ResRobot API)
  electricityZone: string;         // SE1 / SE2 / SE3 / SE4 (default SE3 = Stockholm)

  // Google Calendar
  calendars: CalendarConfig[];       // one entry per person / calendar
  googleCalendarApiKey: string;      // Google Cloud API key with Calendar API enabled
}

export const DEFAULT_SETTINGS: AppSettings = {
  ownerName: "",
  homeName: "My Home",
  address: "",
  theme: "light",
  accentColor: "blue",
  transitRoutes: [],
  trafiklabApiKey: "",
  electricityZone: "SE3",
  backendUrl:
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
      : "http://localhost:8000",
  wsUrl:
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/api/v1/ws")
      : "ws://localhost:8000/api/v1/ws",
  aiProvider: "anthropic",
  calendars: [],
  googleCalendarApiKey: "",
};

const STORAGE_KEY = "nexy_settings";

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: AppSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// Accent color → Tailwind classes map (used by components)
export const ACCENT_MAP: Record<AccentColor, { primary: string; bg: string; text: string; border: string; ring: string }> = {
  blue:   { primary: "bg-blue-500",   bg: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-200",   ring: "ring-blue-300" },
  green:  { primary: "bg-emerald-500",bg: "bg-emerald-50", text: "text-emerald-600",border: "border-emerald-200",ring: "ring-emerald-300" },
  purple: { primary: "bg-violet-500", bg: "bg-violet-50",  text: "text-violet-600", border: "border-violet-200", ring: "ring-violet-300" },
  amber:  { primary: "bg-amber-500",  bg: "bg-amber-50",   text: "text-amber-600",  border: "border-amber-200",  ring: "ring-amber-300" },
};

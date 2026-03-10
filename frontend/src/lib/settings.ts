export type Theme = "light" | "dark" | "system";
export type AccentColor = "blue" | "green" | "purple" | "amber";
export type AIProvider = "anthropic" | "openai" | "ollama";

export interface TransitRoute {
  id: string;
  fromStop: string;
  toStop: string;
  lineFilter: string;
}

export interface HomeSettings {
  homeName: string;
  address: string;
  backendUrl: string;
  wsUrl: string;
  aiProvider: AIProvider;
  trafiklabApiKey: string;
  electricityZone: string;
}

export interface UserSettings {
  ownerName: string;
  theme: Theme;
  accentColor: AccentColor;
  transitRoutes: TransitRoute[];
  googleCalendarIds: string[];
}

export interface AppSettings extends HomeSettings, UserSettings {}

export const DEFAULT_HOME_SETTINGS: HomeSettings = {
  homeName: "My Home",
  address: "",
  backendUrl:
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000")
      : "http://localhost:8000",
  wsUrl:
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/api/v1/ws")
      : "ws://localhost:8000/api/v1/ws",
  aiProvider: "anthropic",
  trafiklabApiKey: "",
  electricityZone: "SE3",
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  ownerName: "",
  theme: "light",
  accentColor: "blue",
  transitRoutes: [],
  googleCalendarIds: [],
};

export const DEFAULT_SETTINGS: AppSettings = {
  ...DEFAULT_HOME_SETTINGS,
  ...DEFAULT_USER_SETTINGS,
};

export const HOME_SETTING_KEYS = [
  "homeName",
  "address",
  "backendUrl",
  "wsUrl",
  "aiProvider",
  "trafiklabApiKey",
  "electricityZone",
] as const;

export const USER_SETTING_KEYS = [
  "ownerName",
  "theme",
  "accentColor",
  "transitRoutes",
  "googleCalendarIds",
] as const;

type HomeSettingKey = (typeof HOME_SETTING_KEYS)[number];
type UserSettingKey = (typeof USER_SETTING_KEYS)[number];

const STORAGE_KEY = "nexy_settings";

export function splitSettings(settings: AppSettings): {
  home: HomeSettings;
  user: UserSettings;
} {
  const home = {} as HomeSettings;
  const user = {} as UserSettings;

  for (const key of HOME_SETTING_KEYS) {
    home[key] = settings[key] as never;
  }
  for (const key of USER_SETTING_KEYS) {
    user[key] = settings[key] as never;
  }

  return { home, user };
}

export function mergeSettings(
  home?: Partial<HomeSettings>,
  user?: Partial<UserSettings>,
): AppSettings {
  return {
    ...DEFAULT_HOME_SETTINGS,
    ...DEFAULT_USER_SETTINGS,
    ...home,
    ...user,
  };
}

export function pickHomePatch(patch: Partial<AppSettings>): Partial<HomeSettings> {
  const next: Partial<HomeSettings> = {};
  for (const key of HOME_SETTING_KEYS) {
    if (key in patch) (next as Record<HomeSettingKey, AppSettings[HomeSettingKey]>)[key] = patch[key] as AppSettings[HomeSettingKey];
  }
  return next;
}

export function pickUserPatch(patch: Partial<AppSettings>): Partial<UserSettings> {
  const next: Partial<UserSettings> = {};
  for (const key of USER_SETTING_KEYS) {
    if (key in patch) (next as Record<UserSettingKey, AppSettings[UserSettingKey]>)[key] = patch[key] as AppSettings[UserSettingKey];
  }
  return next;
}

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as { home?: Partial<HomeSettings>; user?: Partial<UserSettings> } | Partial<AppSettings>;
    if ("home" in parsed || "user" in parsed) {
      return mergeSettings(parsed.home, parsed.user);
    }
    const legacy = parsed as Partial<AppSettings>;
    return mergeSettings(pickHomePatch(legacy), pickUserPatch(legacy));
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === "undefined") return;
  const split = splitSettings(settings);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(split));
}

export const ACCENT_MAP: Record<AccentColor, { primary: string; bg: string; text: string; border: string; ring: string }> = {
  blue: { primary: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200", ring: "ring-blue-300" },
  green: { primary: "bg-emerald-500", bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200", ring: "ring-emerald-300" },
  purple: { primary: "bg-violet-500", bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-200", ring: "ring-violet-300" },
  amber: { primary: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200", ring: "ring-amber-300" },
};

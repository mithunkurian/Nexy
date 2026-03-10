"use client";
import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import {
  type AppSettings,
  type Theme,
  type AccentColor,
  type AIProvider,
  type TransitRoute,
  DEFAULT_SETTINGS,
} from "@/lib/settings";
import {
  User,
  Palette,
  Wifi,
  Bot,
  RotateCcw,
  CheckCircle,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  Server,
  Bus,
  Share2,
  Download,
  Copy,
  Cloud,
  Calendar,
  Plus,
  Trash2,
  Loader,
  LogIn,
  LogOut,
  Shield,
  UserCheck,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VERSION_LABEL } from "@/lib/version";
import { useLandscape } from "@/hooks/useLandscape";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { useAuth } from "@/contexts/AuthContext";
import { useUserManagement } from "@/hooks/useUserManagement";
import type { AllowedUser, Role } from "@/types/auth";

// ─── Section nav config ───────────────────────────────────────────────────────

const ALL_SECTIONS = [
  { id: "profile",    title: "Profile",       icon: User,    adminOnly: false },
  { id: "appearance", title: "Appearance",    icon: Palette, adminOnly: false },
  { id: "connection", title: "Connection",    icon: Wifi,    adminOnly: true  },
  { id: "commute",    title: "Commute",       icon: Bus,     adminOnly: false },
  { id: "ai",         title: "AI Provider",   icon: Bot,     adminOnly: true  },
  { id: "calendar",   title: "Calendar",      icon: Calendar,adminOnly: false },
  { id: "sync",       title: "Sync",          icon: Share2,  adminOnly: true  },
  { id: "users",      title: "Users & Access",icon: Shield,  adminOnly: true  },
  { id: "about",      title: "About",         icon: Server,  adminOnly: false },
] as const;

type SectionId = typeof ALL_SECTIONS[number]["id"];

// ─── Reusable form pieces ────────────────────────────────────────────────────

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
      <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <Icon size={14} className="text-gray-500 dark:text-gray-400" />
        </div>
        <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{title}</span>
      </div>
      <div className="divide-y divide-gray-50 dark:divide-gray-800">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 px-5 py-4">
      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </label>
      {hint && <p className="text-xs text-gray-400 dark:text-gray-500 -mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all"
    />
  );
}

function ChipGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; icon?: React.ElementType }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-medium transition-all",
              active
                ? "bg-blue-500 text-white border-blue-500 shadow-sm"
                : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-300"
            )}
          >
            {Icon && <Icon size={13} />}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

const ACCENT_COLORS: { value: AccentColor; label: string; dot: string }[] = [
  { value: "blue",   label: "Ocean Blue",   dot: "bg-blue-500"    },
  { value: "green",  label: "Forest Green", dot: "bg-emerald-500" },
  { value: "purple", label: "Deep Purple",  dot: "bg-violet-500"  },
  { value: "amber",  label: "Warm Amber",   dot: "bg-amber-500"   },
];

function ColorSwatches({
  value,
  onChange,
}: {
  value: AccentColor;
  onChange: (v: AccentColor) => void;
}) {
  return (
    <div className="flex gap-3 flex-wrap items-center">
      {ACCENT_COLORS.map((c) => (
        <button
          key={c.value}
          title={c.label}
          onClick={() => onChange(c.value)}
          className={cn(
            "w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center",
            c.dot,
            value === c.value
              ? "border-gray-800 dark:border-white scale-110 shadow-md"
              : "border-transparent hover:scale-105"
          )}
        >
          {value === c.value && (
            <CheckCircle size={14} className="text-white" strokeWidth={3} />
          )}
        </button>
      ))}
      <span className="text-xs text-gray-400 ml-1">
        {ACCENT_COLORS.find((c) => c.value === value)?.label}
      </span>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export default function SettingsClient() {
  const landscape = useLandscape();
  const { settings, hydrated, synced, update, reset } = useSettings();
  const { isSignedIn, isLoading: authLoading, error: authError, calendarList, signIn, signOut: signOutCalendar } = useGoogleAuth();
  const { user, role, signOut: signOutApp } = useAuth();
  const { users, allowedUsers, addAllowedUser, removeAllowedUser, updateRole, toggleDisabled, deleteUser } = useUserManagement(role === "admin");
  const [draft, setDraft] = useState<AppSettings>({ ...settings });
  const [saved, setSaved] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [importError, setImportError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const [newRoute, setNewRoute] = useState<Omit<TransitRoute, "id">>({ fromStop: "", toStop: "", lineFilter: "" });
  const [addingRoute, setAddingRoute] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AllowedUser["role"]>("family");

  // Only show sections appropriate for this user's role
  const SECTIONS = ALL_SECTIONS.filter((s) => !s.adminOnly || role === "admin");
  useEffect(() => {
    if (hydrated || synced) setDraft({ ...settings });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, synced, settings]);

  function patch<K extends keyof AppSettings>(key: K, val: AppSettings[K]) {
    setDraft((prev) => ({ ...prev, [key]: val }));
  }

  function handleSave() {
    update(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleReset() {
    if (!confirm("Reset all settings to defaults?")) return;
    reset();
    setDraft({ ...DEFAULT_SETTINGS });
  }

  function handleExport() {
    const code = btoa(JSON.stringify(settings));
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  function handleImport() {
    try {
      const decoded = JSON.parse(atob(importCode.trim()));
      const merged: AppSettings = { ...DEFAULT_SETTINGS, ...decoded };
      update(merged);
      setDraft(merged);
      setImportCode("");
      setImportError("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setImportError("Invalid code — please copy it again from your other device.");
    }
  }

  async function handleInviteUser() {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    await addAllowedUser(email, inviteRole, user?.uid);
    setInviteEmail("");
    setInviteRole("family");
  }

  // ── Section content blocks ──────────────────────────────────────────────────

  const sectionContent: Record<SectionId, React.ReactNode> = {

    profile: (
      <SectionCard title="Profile" icon={User}>
        <Field label="Your Name" hint="Used for personalized greetings on this account">
          <TextInput value={draft.ownerName} onChange={(v) => patch("ownerName", v)} placeholder="e.g. Mithun" />
        </Field>
        {role === "admin" && (
          <>
            <Field label="Home Name" hint="Displayed at the top of the dashboard for the whole home">
              <TextInput value={draft.homeName} onChange={(v) => patch("homeName", v)} placeholder="e.g. My Home" />
            </Field>
            <Field label="Address" hint="Shared home address used for weather and live info">
              <TextInput value={draft.address} onChange={(v) => patch("address", v)} placeholder="e.g. Huddinge, Sweden" />
            </Field>
          </>
        )}
        {/* Sign Out */}
        <div className="px-5 py-4 border-t border-gray-50 dark:border-gray-800">
          <button
            onClick={() => {
              signOutCalendar();
              signOutApp();
            }}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={14} /> Sign out of Nexy
          </button>
        </div>
      </SectionCard>
    ),

    appearance: (
      <SectionCard title="Appearance" icon={Palette}>
        <Field label="Theme">
          <ChipGroup<Theme>
            value={draft.theme}
            onChange={(v) => patch("theme", v)}
            options={[
              { value: "light",  label: "Light",  icon: Sun },
              { value: "dark",   label: "Dark",   icon: Moon },
              { value: "system", label: "System", icon: Monitor },
            ]}
          />
        </Field>
        <Field label="Accent Colour" hint="Used for active states, buttons, and highlights">
          <ColorSwatches value={draft.accentColor} onChange={(v) => patch("accentColor", v)} />
        </Field>
      </SectionCard>
    ),

    connection: (
      <SectionCard title="Connection" icon={Wifi}>
        <Field label="Backend URL" hint="The address of your Nexy backend server">
          <TextInput value={draft.backendUrl} onChange={(v) => patch("backendUrl", v)} placeholder="http://localhost:8000" />
        </Field>
        <Field label="WebSocket URL" hint="Used for real-time device state updates">
          <TextInput value={draft.wsUrl} onChange={(v) => patch("wsUrl", v)} placeholder="ws://localhost:8000/api/v1/ws" />
        </Field>
      </SectionCard>
    ),

    commute: (
      <SectionCard title="Commute & Live Info" icon={Bus}>
        {/* Route list */}
        <Field
          label="Transit Routes"
          hint="Each route fetches departures from a stop filtered by line number. These are personal to this user."
        >
          <div className="space-y-2">
            {draft.transitRoutes.map((route) => (
              <div
                key={route.id}
                className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">
                    {route.fromStop} → {route.toStop}
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Line {route.lineFilter}</p>
                </div>
                <button
                  onClick={() => patch("transitRoutes", draft.transitRoutes.filter((r) => r.id !== route.id))}
                  className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors mt-0.5"
                  title="Remove route"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}

            {/* Add route form */}
            {addingRoute ? (
              <div className="border border-blue-200 dark:border-blue-800 rounded-xl p-3 space-y-2 bg-blue-50/50 dark:bg-blue-900/10">
                <input
                  type="text"
                  value={newRoute.fromStop}
                  onChange={(e) => setNewRoute((r) => ({ ...r, fromStop: e.target.value }))}
                  placeholder="From stop, e.g. Storängsstigen (Huddinge)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-blue-400"
                />
                <input
                  type="text"
                  value={newRoute.toStop}
                  onChange={(e) => setNewRoute((r) => ({ ...r, toStop: e.target.value }))}
                  placeholder="To stop, e.g. Huddinge (Huddinge)"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-blue-400"
                />
                <input
                  type="text"
                  value={newRoute.lineFilter}
                  onChange={(e) => setNewRoute((r) => ({ ...r, lineFilter: e.target.value }))}
                  placeholder="Line number, e.g. 705"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-blue-400"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      if (!newRoute.fromStop.trim() || !newRoute.toStop.trim() || !newRoute.lineFilter.trim()) return;
                      const route: TransitRoute = {
                        id: crypto.randomUUID(),
                        fromStop: newRoute.fromStop.trim(),
                        toStop: newRoute.toStop.trim(),
                        lineFilter: newRoute.lineFilter.trim(),
                      };
                      patch("transitRoutes", [...draft.transitRoutes, route]);
                      setNewRoute({ fromStop: "", toStop: "", lineFilter: "" });
                      setAddingRoute(false);
                    }}
                    disabled={!newRoute.fromStop.trim() || !newRoute.toStop.trim() || !newRoute.lineFilter.trim()}
                    className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-xs font-semibold disabled:opacity-40 hover:bg-blue-600 transition-colors"
                  >
                    Add Route
                  </button>
                  <button
                    onClick={() => { setAddingRoute(false); setNewRoute({ fromStop: "", toStop: "", lineFilter: "" }); }}
                    className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : draft.transitRoutes.length < 6 ? (
              <button
                onClick={() => setAddingRoute(true)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-xs text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
              >
                <Plus size={13} /> Add route
              </button>
            ) : null}
          </div>
        </Field>

        {role === "admin" && (
          <>
            <Field label="Trafiklab API Key" hint="Free key from trafiklab.se → ResRobot API. Required for household transit times.">
              <TextInput value={draft.trafiklabApiKey} onChange={(v) => patch("trafiklabApiKey", v)} placeholder="Enter your ResRobot API key" type="password" />
            </Field>
            <Field label="Electricity Zone" hint="Shared Swedish price zone for household electricity prices">
              <ChipGroup<string>
                value={draft.electricityZone || "SE3"}
                onChange={(v) => patch("electricityZone", v)}
                options={[
                  { value: "SE1", label: "SE1 (North)" },
                  { value: "SE2", label: "SE2 (Mid-N)" },
                  { value: "SE3", label: "SE3 (Stockholm)" },
                  { value: "SE4", label: "SE4 (South)" },
                ]}
              />
            </Field>
          </>
        )}
      </SectionCard>
    ),

    ai: (
      <SectionCard title="AI Provider" icon={Bot}>
        <Field label="Active AI" hint="Which language model powers Nexy's natural language control">
          <ChipGroup<AIProvider>
            value={draft.aiProvider}
            onChange={(v) => patch("aiProvider", v)}
            options={[
              { value: "anthropic", label: "Claude (Anthropic)" },
              { value: "openai",    label: "GPT-4o (OpenAI)" },
              { value: "ollama",    label: "Ollama (Local)" },
            ]}
          />
        </Field>
      </SectionCard>
    ),

    calendar: (
      <SectionCard title="Google Calendar" icon={Calendar}>
        <div className="px-5 py-4 space-y-4">
          {/* ── Not connected ── */}
          {!isSignedIn && !authLoading && (
            <div className="space-y-3">
              <p className="text-xs text-gray-400 dark:text-gray-500 leading-relaxed">
                Sign in with Google to access your private calendars. Your calendars do <strong className="text-gray-600 dark:text-gray-300">not</strong> need to be made public.
              </p>
              {authError && (
                <p className="text-xs text-red-500">{authError}</p>
              )}
              <button
                onClick={signIn}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm"
              >
                <LogIn size={14} className="text-blue-500" />
                Connect with Google
              </button>
            </div>
          )}

          {/* ── Signing in (loading) ── */}
          {authLoading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader size={14} className="animate-spin text-blue-500" />
              Connecting…
            </div>
          )}

          {/* ── Connected ── */}
          {isSignedIn && !authLoading && (
            <div className="space-y-3">
              {/* Connected header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Connected</span>
                </div>
                <button
                  onClick={signOutCalendar}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={11} /> Disconnect
                </button>
              </div>

              {/* Calendar picker */}
              {calendarList.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Select calendars to show</p>
                  {calendarList.map((cal) => {
                    const checked = draft.googleCalendarIds.includes(cal.id);
                    return (
                      <label
                        key={cal.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? draft.googleCalendarIds.filter((id) => id !== cal.id)
                              : [...draft.googleCalendarIds, cal.id];
                            patch("googleCalendarIds", next);
                          }}
                          className="w-4 h-4 rounded accent-blue-500"
                        />
                        <span className="text-xs text-gray-800 dark:text-gray-200 flex-1 truncate">{cal.summary}</span>
                        {cal.primary && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">primary</span>
                        )}
                      </label>
                    );
                  })}
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 pt-1">
                    Changes saved with the Save Settings button below.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Loader size={12} className="animate-spin" />
                  Loading your calendars…
                </div>
              )}
            </div>
          )}
        </div>
      </SectionCard>
    ),

    sync: (
      <SectionCard title="Sync Across Devices" icon={Share2}>
        <div className="flex items-start gap-3 px-5 py-4">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Cloud size={14} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Automatic cloud sync is active</p>
            <p className="text-xs text-gray-400 mt-0.5">Settings are saved to Firebase and instantly shared across all your devices.</p>
          </div>
        </div>
        <Field label="Manual Backup" hint="Use this if you want to copy settings to a device that's offline.">
          <button
            onClick={handleExport}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all",
              copied
                ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-blue-300"
            )}
          >
            {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
            {copied ? "Copied to clipboard!" : "Copy Settings Code"}
          </button>
        </Field>
        <Field label="Import Settings" hint="Paste a settings code from another device here to apply all settings.">
          <div className="flex gap-2">
            <input
              type="text"
              value={importCode}
              onChange={(e) => { setImportCode(e.target.value); setImportError(""); }}
              placeholder="Paste settings code here…"
              className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
            <button
              onClick={handleImport}
              disabled={!importCode.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium disabled:opacity-40 hover:bg-blue-600 transition-all flex items-center gap-1.5"
            >
              <Download size={14} />
              Apply
            </button>
          </div>
          {importError && <p className="text-xs text-red-500 mt-1">{importError}</p>}
        </Field>
      </SectionCard>
    ),

    users: (
      <SectionCard title="Users & Access" icon={Shield}>
        <Field label="Add User" hint="Only approved email addresses can sign in to this Nexy home.">
          <div className="flex flex-col gap-2">
            <TextInput value={inviteEmail} onChange={setInviteEmail} placeholder="name@example.com" />
            <ChipGroup<AllowedUser["role"]>
              value={inviteRole}
              onChange={setInviteRole}
              options={[
                { value: "family", label: "Family" },
                { value: "admin", label: "Admin" },
              ]}
            />
            <button
              onClick={handleInviteUser}
              disabled={!inviteEmail.trim()}
              className="self-start px-4 py-2 rounded-xl bg-blue-500 text-white text-sm font-medium disabled:opacity-40 hover:bg-blue-600 transition-colors"
            >
              Add approved user
            </button>
          </div>
        </Field>
        {allowedUsers.length > 0 && (
          <div className="px-5 py-4 space-y-2">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Approved Emails</p>
            {allowedUsers.map((allowed) => (
              <div key={allowed.email} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{allowed.email}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {allowed.role}
                    {allowed.claimedByUid ? " · joined" : " · waiting for first login"}
                  </p>
                </div>
                <button
                  onClick={() => removeAllowedUser(allowed.email)}
                  title="Remove approved email"
                  className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        {users.length === 0 ? (
          <div className="px-5 py-4 text-xs text-gray-400">No users found.</div>
        ) : (
          users.map((u) => (
            <div key={u.uid} className="flex items-center gap-3 px-5 py-3.5">
              {/* Avatar / name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{u.displayName}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{u.email}</p>
              </div>

              {/* Role selector */}
              <select
                value={u.role}
                onChange={(e) => updateRole(u.uid, e.target.value as Role)}
                className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-blue-400"
              >
                <option value="pending">Pending</option>
                <option value="family">Family</option>
                <option value="admin">Admin</option>
              </select>

              {/* Enable / Disable */}
              <button
                onClick={() => toggleDisabled(u.uid, !u.disabled)}
                title={u.disabled ? "Enable access" : "Disable access"}
                className={cn(
                  "p-1.5 rounded-lg transition-colors",
                  u.disabled
                    ? "text-gray-300 dark:text-gray-600 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    : "text-emerald-500 hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                {u.disabled ? <UserX size={14} /> : <UserCheck size={14} />}
              </button>

              {/* Delete */}
              <button
                onClick={() => { if (confirm(`Remove ${u.displayName}?`)) deleteUser(u.uid); }}
                title="Remove user"
                className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
        <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-800">
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Users must be added here before they can sign in. Once they join, you can disable or promote them.
          </p>
        </div>
      </SectionCard>
    ),

    about: (
      <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <a
          href={`${draft.backendUrl}/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Server size={15} className="text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">API Documentation</span>
          </div>
          <ChevronRight size={15} className="text-gray-300" />
        </a>
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-50 dark:border-gray-800">
          <span className="text-sm text-gray-400">Version</span>
          <span className="text-xs font-mono text-gray-500">{VERSION_LABEL}</span>
        </div>
      </section>
    ),
  };

  // ── Save / Reset buttons ────────────────────────────────────────────────────
  const saveReset = (
    <div className="flex gap-3">
      <button
        onClick={handleSave}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all shadow-sm",
          saved ? "bg-emerald-500 text-white" : "bg-blue-500 hover:bg-blue-600 text-white"
        )}
      >
        {saved ? <><CheckCircle size={16} /> Saved!</> : "Save Settings"}
      </button>
      <button
        onClick={handleReset}
        className="px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-1.5"
      >
        <RotateCcw size={14} />
        Reset
      </button>
    </div>
  );

  // ── Sync status badge ────────────────────────────────────────────────────────
  const syncBadge = (
    <div className={cn(
      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium",
      synced
        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
        : "bg-gray-100 dark:bg-gray-800 text-gray-400"
    )}>
      <Cloud size={11} />
      {synced ? "Synced" : "Syncing…"}
    </div>
  );

  // ── LANDSCAPE: two-panel layout ─────────────────────────────────────────────
  if (landscape) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Top header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Settings</h1>
            <p className="text-xs text-gray-400">Configure your Nexy experience</p>
          </div>
          {syncBadge}
        </div>

        {/* Two-panel body */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left: category nav */}
          <nav className="w-48 flex-shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 overflow-y-auto py-3 px-2 space-y-0.5">
            {SECTIONS.map(({ id, title, icon: Icon }) => {
              const active = activeSection === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left",
                    active
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200"
                  )}
                >
                  <Icon size={15} strokeWidth={active ? 2.5 : 1.8} className="flex-shrink-0" />
                  {title}
                </button>
              );
            })}
          </nav>

          {/* Right: active section content */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {sectionContent[activeSection]}
            {activeSection !== "about" && saveReset}
          </div>
        </div>
      </div>
    );
  }

  // ── PORTRAIT: single-column scrollable layout (unchanged) ───────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-sm text-gray-400 mt-0.5">Configure your Nexy experience</p>
        </div>
        {syncBadge}
      </div>

      {Object.values(sectionContent)}

      {saveReset}
    </div>
  );
}

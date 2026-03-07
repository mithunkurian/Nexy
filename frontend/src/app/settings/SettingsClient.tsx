"use client";
import { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import {
  type AppSettings,
  type Theme,
  type AccentColor,
  type AIProvider,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VERSION_LABEL } from "@/lib/version";

// ─── Reusable form pieces ────────────────────────────────────────────────────

function Section({
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

const ACCENT_COLORS: { value: AccentColor; label: string; dot: string; ring: string }[] = [
  { value: "blue",   label: "Ocean Blue",   dot: "bg-blue-500",    ring: "ring-blue-500" },
  { value: "green",  label: "Forest Green", dot: "bg-emerald-500", ring: "ring-emerald-500" },
  { value: "purple", label: "Deep Purple",  dot: "bg-violet-500",  ring: "ring-violet-500" },
  { value: "amber",  label: "Warm Amber",   dot: "bg-amber-500",   ring: "ring-amber-500" },
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
  const { settings, hydrated, update, reset } = useSettings();
  const [draft, setDraft] = useState<AppSettings>({ ...settings });
  const [saved, setSaved] = useState(false);
  const [importCode, setImportCode] = useState("");
  const [importError, setImportError] = useState("");
  const [copied, setCopied] = useState(false);

  // ── Fix: sync draft once localStorage has loaded ──────────────────────────
  useEffect(() => {
    if (hydrated) setDraft({ ...settings });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

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

  // ── Export: encode all settings as a base64 string ───────────────────────
  function handleExport() {
    const code = btoa(JSON.stringify(settings));
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  // ── Import: decode the base64 string and apply settings ──────────────────
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

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Configure your Nexy experience</p>
      </div>

      {/* Profile */}
      <Section title="Profile" icon={User}>
        <Field label="Your Name" hint="Used for personalized greetings on the dashboard">
          <TextInput
            value={draft.ownerName}
            onChange={(v) => patch("ownerName", v)}
            placeholder="e.g. Mithun"
          />
        </Field>
        <Field label="Home Name" hint="Displayed at the top of the dashboard">
          <TextInput
            value={draft.homeName}
            onChange={(v) => patch("homeName", v)}
            placeholder="e.g. My Home"
          />
        </Field>
        <Field label="Address" hint="Your home address — used for weather location">
          <TextInput
            value={draft.address}
            onChange={(v) => patch("address", v)}
            placeholder="e.g. Huddinge, Sweden"
          />
        </Field>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" icon={Palette}>
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
      </Section>

      {/* Connection */}
      <Section title="Connection" icon={Wifi}>
        <Field label="Backend URL" hint="The address of your Nexy backend server">
          <TextInput
            value={draft.backendUrl}
            onChange={(v) => patch("backendUrl", v)}
            placeholder="http://localhost:8000"
          />
        </Field>
        <Field label="WebSocket URL" hint="Used for real-time device state updates">
          <TextInput
            value={draft.wsUrl}
            onChange={(v) => patch("wsUrl", v)}
            placeholder="ws://localhost:8000/api/v1/ws"
          />
        </Field>
      </Section>

      {/* Commute & Live Info */}
      <Section title="Commute & Live Info" icon={Bus}>
        <Field label="Home Stop" hint='Your home bus/tram stop name, e.g. "Storängsstigen"'>
          <TextInput
            value={draft.commuteStopA}
            onChange={(v) => patch("commuteStopA", v)}
            placeholder="e.g. Storängsstigen"
          />
        </Field>
        <Field label="Destination Stop" hint='Your destination stop, e.g. "Huddinge Station"'>
          <TextInput
            value={draft.commuteStopB}
            onChange={(v) => patch("commuteStopB", v)}
            placeholder="e.g. Huddinge Station"
          />
        </Field>
        <Field
          label="Trafiklab API Key"
          hint="Free key from trafiklab.se → ResRobot API. Required for bus times."
        >
          <TextInput
            value={draft.trafiklabApiKey}
            onChange={(v) => patch("trafiklabApiKey", v)}
            placeholder="Enter your ResRobot API key"
          />
        </Field>
        <Field label="Electricity Zone" hint="Swedish price zone for live electricity prices">
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
      </Section>

      {/* AI Provider */}
      <Section title="AI Provider" icon={Bot}>
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
      </Section>

      {/* Sync across devices */}
      <Section title="Sync Across Devices" icon={Share2}>
        <Field
          label="Export Settings"
          hint="Copy this code and paste it on any other device to sync all your settings instantly."
        >
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
        <Field
          label="Import Settings"
          hint="Paste a settings code from another device here to apply all settings."
        >
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
          {importError && (
            <p className="text-xs text-red-500 mt-1">{importError}</p>
          )}
        </Field>
      </Section>

      {/* Save / Reset */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all shadow-sm",
            saved
              ? "bg-emerald-500 text-white"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          )}
        >
          {saved ? (
            <>
              <CheckCircle size={16} />
              Saved!
            </>
          ) : (
            "Save Settings"
          )}
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-1.5"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {/* About */}
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
    </div>
  );
}

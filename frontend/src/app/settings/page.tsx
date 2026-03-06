"use client";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface HealthData {
  status: string;
  version: string;
}

export default function SettingsPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    fetch(`${base}/health`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null))
      .finally(() => setHealthLoading(false));
  }, []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400">Configuration &amp; status</p>
      </div>

      {/* Backend status */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
        <h2 className="font-semibold text-gray-700">Backend API</h2>
        <div className="flex items-center gap-3 text-sm">
          {healthLoading ? (
            <Loader2 size={16} className="animate-spin text-gray-400" />
          ) : health ? (
            <>
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-green-700">Connected</span>
              <span className="text-gray-400">· v{health.version}</span>
            </>
          ) : (
            <>
              <XCircle size={16} className="text-red-500" />
              <span className="text-red-600">Not reachable</span>
              <span className="text-gray-400 text-xs">
                · Make sure the backend is running on port 8000
              </span>
            </>
          )}
        </div>
      </section>

      {/* Info cards */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-700">Integrations</h2>
        <InfoRow label="IKEA Dirigera" hint="Set DIRIGERA_HOST + DIRIGERA_TOKEN in backend/.env" />
        <InfoRow label="Matter / Thread" hint="Set MATTER_SERVER_URL in backend/.env" />
        <InfoRow label="AI Provider" hint="Set ACTIVE_AI_PROVIDER + API key in backend/.env" />
      </section>

      {/* Links */}
      <section className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
        <h2 className="font-semibold text-gray-700 mb-3">Quick Links</h2>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/docs`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-nexy-600 hover:underline"
        >
          API Documentation (Swagger) →
        </a>
      </section>

      <p className="text-center text-xs text-gray-300">Nexy v0.1.0</p>
    </div>
  );
}

function InfoRow({ label, hint }: { label: string; hint: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{hint}</p>
    </div>
  );
}

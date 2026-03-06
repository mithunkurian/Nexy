"use client";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { getActivity, formatRelative, type ActivityEntry } from "@/lib/activity";

export function ActivityFeed() {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  function load() {
    setEntries(getActivity().slice(0, 8));
  }

  useEffect(() => {
    load();
    window.addEventListener("nexy_activity_update", load);
    return () => window.removeEventListener("nexy_activity_update", load);
  }, []);

  if (entries.length === 0) return null;

  return (
    <section>
      <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
        Recent Activity
      </h2>
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm divide-y divide-gray-50 dark:divide-gray-800 overflow-hidden">
        {entries.map((e) => (
          <div key={e.id} className="flex items-start gap-3 px-4 py-3">
            <span className="flex-shrink-0 text-base mt-0.5">{e.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                {e.title}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{e.detail}</p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-1 text-[10px] text-gray-300 dark:text-gray-600 mt-0.5">
              <Clock size={10} />
              {formatRelative(e.timestamp)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

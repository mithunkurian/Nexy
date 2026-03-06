"use client";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

export function AskNexyBar() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/chat")}
      className="w-full flex items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3.5 shadow-sm hover:border-nexy-200 hover:shadow-md transition-all group text-left"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-nexy-50 flex items-center justify-center group-hover:bg-nexy-100 transition-colors">
        <Sparkles size={15} className="text-nexy-500" />
      </div>
      <span className="flex-1 text-sm text-gray-400 group-hover:text-gray-500">
        Ask Nexy to control your home...
      </span>
      <span className="text-xs text-nexy-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
        Open chat →
      </span>
    </button>
  );
}

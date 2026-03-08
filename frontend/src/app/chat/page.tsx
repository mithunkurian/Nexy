"use client";
import { Suspense } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useLandscape } from "@/hooks/useLandscape";

export default function ChatPage() {
  const landscape = useLandscape();

  if (landscape) {
    // Landscape: fill the full height of the side-nav layout, no scroll
    return (
      <div className="h-full flex flex-col px-4 py-3 overflow-hidden">
        <div className="mb-3 flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Nexy AI</h1>
          <p className="text-xs text-gray-400">Control your home with natural language</p>
        </div>
        <div className="flex-1 min-h-0">
          <Suspense>
            <ChatInterface />
          </Suspense>
        </div>
      </div>
    );
  }

  // Portrait: original layout
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 h-[calc(100vh-5rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Nexy AI</h1>
        <p className="text-sm text-gray-400">Control your home with natural language</p>
      </div>
      <div className="h-[calc(100%-5rem)]">
        <Suspense>
          <ChatInterface />
        </Suspense>
      </div>
    </div>
  );
}

"use client";
import { ChatInterface } from "@/components/chat/ChatInterface";

export default function ChatPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 h-[calc(100vh-5rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Nexy AI</h1>
        <p className="text-sm text-gray-400">Control your home with natural language</p>
      </div>
      <div className="h-[calc(100%-5rem)]">
        <ChatInterface />
      </div>
    </div>
  );
}

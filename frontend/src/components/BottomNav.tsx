"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Layers, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/",         label: "Home",     icon: Home },
  { href: "/chat",     label: "Nexy AI",  icon: MessageCircle },
  { href: "/devices",  label: "Devices",  icon: Layers },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-800">
      <div className="flex max-w-lg mx-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors",
                active
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300",
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

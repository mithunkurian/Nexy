"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Layers, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { href: "/",         label: "Home",     icon: Home },
  { href: "/chat",     label: "Nexy AI",  icon: MessageCircle },
  { href: "/devices",  label: "Devices",  icon: Layers },
  { href: "/settings", label: "Settings", icon: SlidersHorizontal },
];

export function SideNav() {
  const pathname = usePathname();
  const { role } = useAuth();
  const visibleNav = NAV.filter(({ href }) => href !== "/settings" || role === "admin");

  return (
    <nav className="fixed left-0 top-0 bottom-0 z-50 w-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-r border-gray-100 dark:border-gray-800 flex flex-col items-center py-5 gap-1">
      {/* Logo mark */}
      <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center mb-5 flex-shrink-0">
        <span className="text-white text-sm font-bold select-none">N</span>
      </div>

      {visibleNav.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl w-13 text-center transition-colors w-full mx-1",
              active
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
            <span className="text-[9px] font-medium leading-tight">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

"use client";
import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login"];

// Routes that require admin role
const ADMIN_ROUTES = ["/settings"];

export function RouteGuard({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;

    const isPublic = PUBLIC_ROUTES.includes(pathname);
    const isAdminRoute = ADMIN_ROUTES.some((r) => pathname.startsWith(r));

    if (!user && !isPublic) {
      router.replace("/login");
      return;
    }
    if (user && isPublic) {
      router.replace("/");
      return;
    }
    if (profile?.role === "family" && isAdminRoute) {
      router.replace("/");
    }
  }, [loading, user, profile, pathname, router]);

  // Full-screen spinner while auth state loads
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Loader2 size={28} className="animate-spin text-gray-300 dark:text-gray-600" />
      </div>
    );
  }

  // Prevent flash: hide content if about to redirect
  const isPublic = PUBLIC_ROUTES.includes(pathname);
  if (!user && !isPublic) return null;

  // Pending approval screen
  if (user && profile?.role === "pending" && !isPublic) {
    return <PendingScreen />;
  }

  // Disabled account screen
  if (user && profile?.disabled && !isPublic) {
    return <DisabledScreen />;
  }

  return <>{children}</>;
}

// ─── Blocking screens ─────────────────────────────────────────────────────────

function PendingScreen() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-yellow-400 flex items-center justify-center mb-5 shadow">
        <span className="text-white text-2xl font-bold select-none">N</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
        Waiting for Approval
      </h2>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-8 max-w-xs">
        Your account is pending. Ask the home admin to grant you access in Settings → Users.
      </p>
      <button
        onClick={() => signOut()}
        className="text-sm text-blue-500 hover:underline"
      >
        Sign out
      </button>
    </div>
  );
}

function DisabledScreen() {
  const { signOut } = useAuth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 px-6 text-center">
      <div className="w-14 h-14 rounded-2xl bg-red-400 flex items-center justify-center mb-5 shadow">
        <span className="text-white text-2xl font-bold select-none">N</span>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
        Access Revoked
      </h2>
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-8 max-w-xs">
        Your access to this home has been disabled. Contact the admin.
      </p>
      <button
        onClick={() => signOut()}
        className="text-sm text-blue-500 hover:underline"
      >
        Sign out
      </button>
    </div>
  );
}

"use client";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useStore";
import { useEffect, useState } from "react";
import Link from "next/link";

const NAV = [
  { href: "/dashboard", label: "Home", icon: "🏠" },
  { href: "/transactions", label: "Entry", icon: "📝" },
  { href: "/reports", label: "Reports", icon: "📊" },
  { href: "/categories", label: "Categories", icon: "🏷️" },
  { href: "/team", label: "Team", icon: "👥" },
];

const ALL_NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/transactions", label: "Transactions", icon: "📝" },
  { href: "/reports", label: "Reports", icon: "📊" },
  { href: "/categories", label: "Categories", icon: "🏷️" },
  { href: "/payment-methods", label: "Payments", icon: "💳" },
  { href: "/team", label: "Team", icon: "👥" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, clearAuth, setAuth } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    if (!token && typeof window !== "undefined") {
      const storedToken = sessionStorage.getItem("lc_token");
      const storedRefresh = sessionStorage.getItem("lc_refresh");
      const storedUser = sessionStorage.getItem("lc_user");
      if (storedToken && storedRefresh && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setAuth({ token: storedToken, refreshToken: storedRefresh, user });
        } catch {
          clearAuth();
        }
      }
    }
  }, [token, setAuth, clearAuth]);

  useEffect(() => {
    if (hydrated && !token) router.replace("/auth/login");
  }, [hydrated, token, router]);

  if (!hydrated || !token) return null;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar - desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-gray-200 bg-white p-4 gap-1 shadow-sm">
        <div className="mb-6 px-3 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">₹</span>
          </div>
          <div>
            <p className="text-orange-500 font-bold text-lg leading-tight">Kharchoo</p>
            <p className="text-gray-400 text-xs truncate">{user?.name}</p>
          </div>
        </div>
        {ALL_NAV.map((item) => (
          <Link key={item.href} href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname === item.href
                ? "bg-orange-50 text-orange-600 border border-orange-100"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
            }`}>
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        <div className="mt-auto">
          <button onClick={() => { clearAuth(); router.replace("/auth/login"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all">
            <span>🚪</span><span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">₹</span>
            </div>
            <span className="text-orange-500 font-bold text-lg">Kharchoo</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs">{user?.name}</span>
            <button onClick={() => { clearAuth(); router.replace("/auth/login"); }}
              className="text-gray-400 text-sm hover:text-red-500">Sign out</button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24 lg:pb-0">
          {children}
        </main>

        {/* Bottom nav - mobile */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-lg flex items-center justify-around px-2 py-2 z-50">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-xs transition-all ${
                pathname === item.href ? "text-orange-500" : "text-gray-400"
              }`}>
              <span className={`text-xl ${pathname === item.href ? "scale-110" : ""} transition-transform`}>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

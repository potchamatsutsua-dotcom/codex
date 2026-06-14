"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Bell, LogOut, Settings, LayoutDashboard, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@/types";

interface NavbarProps {
  user?: UserType | null;
}

const navLinks = [
  { href: "/dashboard", label: "ダッシュボード", icon: "🏠" },
  { href: "/dashboard/contests", label: "コンテスト", icon: "🏆" },
  { href: "/dashboard/recommendations", label: "おすすめ", icon: "✨" },
  { href: "/dashboard/watchlist", label: "保存済み", icon: "🔖" },
];

const PLAN_COLORS = {
  free: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  pro: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  premium: "bg-gradient-to-r from-amber-400 to-orange-400 text-white",
};

export function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between px-4 max-w-7xl">
        {/* Logo */}
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2 font-black text-xl">
          <span className="text-2xl">🦉</span>
          <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            Bounty Owl
          </span>
        </Link>

        {/* Desktop nav */}
        {user && (
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  pathname === link.href
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="テーマ切替"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {user ? (
            <>
              {/* Notification bell */}
              <button className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <Bell className="h-4 w-4" />
              </button>

              {/* Avatar menu */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted transition-colors"
                >
                  <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-black">
                    {user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs font-semibold leading-none">{user.name ?? "ユーザー"}</div>
                    <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold", PLAN_COLORS[user.plan ?? "free"])}>
                      {user.plan?.toUpperCase() ?? "FREE"}
                    </span>
                  </div>
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 w-52 rounded-2xl border bg-popover shadow-xl z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b bg-muted/50">
                        <p className="text-sm font-semibold truncate">{user.name ?? user.email}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        {[
                          { href: "/dashboard", icon: LayoutDashboard, label: "ダッシュボード" },
                          { href: "/dashboard/profile", icon: Settings, label: "プロフィール設定" },
                        ].map((item) => {
                          const Icon = item.icon;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl hover:bg-muted transition-colors"
                              onClick={() => setMenuOpen(false)}
                            >
                              <Icon className="h-4 w-4 text-muted-foreground" />
                              {item.label}
                            </Link>
                          );
                        })}
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-sm rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          ログアウト
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <Button variant="gradient" size="sm" className="font-bold" asChild>
              <Link href="/login">ログイン</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Mobile nav drawer */}
      {user && mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                  : "text-muted-foreground hover:bg-muted"
              )}
              onClick={() => setMobileOpen(false)}
            >
              <span>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

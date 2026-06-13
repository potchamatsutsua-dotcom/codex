"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Bell, User, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@/types";

interface NavbarProps {
  user?: UserType | null;
}

const navLinks = [
  { href: "/dashboard", label: "ダッシュボード" },
  { href: "/dashboard/contests", label: "コンテスト" },
  { href: "/dashboard/recommendations", label: "おすすめ" },
  { href: "/dashboard/watchlist", label: "ウォッチリスト" },
];

export function Navbar({ user }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
          <span className="text-2xl">🦉</span>
          <span className="font-bold text-lg bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
            Bounty Owl
          </span>
        </Link>

        {user && (
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm transition-colors",
                  pathname === link.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-4 w-4" />
              </Button>

              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full p-1 hover:bg-muted transition-colors"
                >
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.[0]?.toUpperCase() ?? user.email[0].toUpperCase()}
                  </div>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border bg-popover shadow-lg overflow-hidden">
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium truncate">{user.name ?? user.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.plan}プラン</p>
                    </div>
                    <div className="p-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        ダッシュボード
                      </Link>
                      <Link
                        href="/dashboard/profile"
                        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Settings className="h-4 w-4" />
                        プロフィール設定
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted text-red-500 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        ログアウト
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button
                className="md:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">ログイン</Link>
              </Button>
              <Button variant="gradient" size="sm" asChild>
                <Link href="/signup">無料で始める</Link>
              </Button>
            </>
          )}
        </div>
      </div>

      {user && mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 py-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "block px-3 py-2 rounded-md text-sm transition-colors",
                pathname === link.href
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground"
              )}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

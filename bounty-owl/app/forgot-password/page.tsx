"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createSupabaseBrowserClient } from "@/lib/auth/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createSupabaseBrowserClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) {
        toast({ title: "エラー", description: error.message, variant: "destructive" });
        return;
      }
      setSent(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-4xl">🦉</span>
            <span className="text-2xl font-black bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              Bounty Owl
            </span>
          </Link>
          <h1 className="text-2xl font-black">{sent ? "メールを送信しました" : "パスワードをリセット"}</h1>
        </div>

        <div className="bg-card rounded-2xl border shadow-lg p-6">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <p className="text-muted-foreground text-sm mb-6">
                <strong>{email}</strong> にパスワードリセットのリンクを送信しました。メールをご確認ください。
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4" />
                  ログインに戻る
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                登録したメールアドレスを入力してください。パスワードリセットのリンクをお送りします。
              </p>
              <div>
                <Label htmlFor="email">メールアドレス</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <Button type="submit" variant="gradient" className="w-full" disabled={isLoading}>
                {isLoading ? "送信中..." : "リセットメールを送信"}
              </Button>
              <Button variant="ghost" className="w-full" asChild>
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4" />
                  ログインに戻る
                </Link>
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

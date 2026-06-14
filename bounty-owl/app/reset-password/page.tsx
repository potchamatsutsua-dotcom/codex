"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createSupabaseBrowserClient } from "@/lib/auth/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(!!session);
    });
  }, [supabase]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "エラー", description: "パスワードが一致しません", variant: "destructive" });
      return;
    }
    if (password.length < 8) {
      toast({ title: "エラー", description: "8文字以上で設定してください", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast({ title: "エラー", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "パスワードを更新しました" });
      router.push("/dashboard");
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
          <h1 className="text-2xl font-black">新しいパスワードを設定</h1>
        </div>

        <div className="bg-card rounded-2xl border shadow-lg p-6">
          {!ready ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">⏳</div>
              <p className="text-muted-foreground text-sm">リンクを確認中...</p>
              <p className="text-xs text-muted-foreground mt-2">
                リンクが無効な場合は
                <Link href="/forgot-password" className="text-primary hover:underline ml-1">
                  こちらから再送信
                </Link>
              </p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <Label htmlFor="password">新しいパスワード（8文字以上）</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 pr-9"
                    required
                    minLength={8}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShow(!show)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="confirm">パスワード確認</Label>
                <div className="relative mt-1.5">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirm"
                    type={show ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="pl-9"
                    required
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {password && confirm && password !== confirm && (
                <p className="text-xs text-red-500">パスワードが一致しません</p>
              )}

              <Button
                type="submit"
                variant="gradient"
                className="w-full"
                disabled={isLoading || (!!password && !!confirm && password !== confirm)}
              >
                {isLoading ? "更新中..." : "パスワードを更新"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

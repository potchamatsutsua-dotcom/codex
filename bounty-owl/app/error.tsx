"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 gap-4">
      <div className="text-7xl mb-2">😵</div>
      <h1 className="text-2xl font-black">エラーが発生しました</h1>
      <p className="text-muted-foreground max-w-xs text-sm">
        予期しないエラーが発生しました。しばらく経ってから再試行してください。
      </p>
      <div className="flex gap-3 mt-4">
        <Button variant="gradient" onClick={reset}>
          もう一度試す
        </Button>
        <Button variant="outline" onClick={() => (window.location.href = "/")}>
          ホームへ
        </Button>
      </div>
      {error.digest && (
        <p className="text-xs text-muted-foreground font-mono mt-2">Error ID: {error.digest}</p>
      )}
    </div>
  );
}

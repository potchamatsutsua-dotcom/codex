import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 gap-4">
      <div className="text-8xl mb-2">🦉</div>
      <h1 className="text-4xl font-black">404</h1>
      <p className="text-xl font-semibold">ページが見つかりません</p>
      <p className="text-muted-foreground max-w-xs">
        探しているページは移動・削除されたか、URLが間違っている可能性があります。
      </p>
      <div className="flex gap-3 mt-4">
        <Button variant="gradient" asChild>
          <Link href="/">ホームへ</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/contests">コンテスト一覧</Link>
        </Button>
      </div>
    </div>
  );
}

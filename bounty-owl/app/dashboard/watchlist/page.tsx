"use client";

import { useEffect, useState, useTransition } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { ContestCard } from "@/components/contest/ContestCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { ContestWithMatch } from "@/types";

async function fetchWatchlist(): Promise<ContestWithMatch[]> {
  const res = await fetch("/api/watchlist");
  if (!res.ok) return [];
  const data = await res.json() as { contests: ContestWithMatch[] };
  return data.contests ?? [];
}

async function toggleWatchlist(contestId: string, remove: boolean): Promise<void> {
  await fetch("/api/watchlist", {
    method: remove ? "DELETE" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contestId }),
  });
}

export default function WatchlistPage() {
  const [contests, setContests] = useState<ContestWithMatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    fetchWatchlist()
      .then(setContests)
      .finally(() => setIsLoading(false));
  }, []);

  const handleWatchlistToggle = async (contestId: string, isWatched: boolean) => {
    if (!isWatched) return;
    await toggleWatchlist(contestId, true);
    setContests((prev) => prev.filter((c) => c.id !== contestId));
    toast({ title: "ウォッチリストから削除しました" });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">ウォッチリスト</h1>
          <p className="text-muted-foreground mt-1">読み込み中...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ウォッチリスト</h1>
        <p className="text-muted-foreground mt-1">
          {contests.length}件のコンテストを保存中
        </p>
      </div>

      {contests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contests.map((contest) => (
            <ContestCard
              key={contest.id}
              contest={contest}
              showMatch
              onWatchlistToggle={handleWatchlistToggle}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium mb-2">保存済みコンテストはありません</p>
          <p className="text-muted-foreground text-sm">
            コンテスト一覧からブックマークアイコンをクリックして保存できます
          </p>
          <Button variant="gradient" className="mt-4" asChild>
            <a href="/dashboard/contests">コンテストを探す</a>
          </Button>
        </div>
      )}
    </div>
  );
}

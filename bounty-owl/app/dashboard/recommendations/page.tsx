import { ContestCard } from "@/components/contest/ContestCard";
import { requireAuth } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/db/client";
import { getUserProfile } from "@/lib/db/users";
import { computeAllMatchesForUser } from "@/lib/ai/matcher";
import type { ContestWithMatch, SortOption } from "@/types";
import { Button } from "@/components/ui/button";
import { Brain } from "lucide-react";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "マッチ度順" },
  { value: "win_probability", label: "勝率順" },
  { value: "expected_value", label: "期待収益順" },
  { value: "prize", label: "賞金順" },
  { value: "deadline", label: "締切順" },
];

interface SearchParams {
  sort?: string;
}

async function getRecommendations(userId: string, sort: SortOption): Promise<ContestWithMatch[]> {
  let query = supabaseAdmin
    .from("user_matches")
    .select(`
      *,
      contests(
        *,
        contest_analysis(*),
        watchlists(id)
      )
    `)
    .eq("user_id", userId)
    .gte("match_score", 40)
    .eq("contests.status", "active")
    .limit(30);

  switch (sort) {
    case "win_probability":
      query = query.order("win_probability", { ascending: false });
      break;
    case "expected_value":
      query = query.order("expected_value", { ascending: false });
      break;
    default:
      query = query.order("match_score", { ascending: false });
  }

  const { data } = await query;
  if (!data) return [];

  return data
    .filter((m) => m.contests)
    .map((m) => ({
      ...m.contests,
      contest_analysis: m.contests.contest_analysis?.[0] ?? null,
      user_matches: {
        match_score: m.match_score,
        win_probability: m.win_probability,
        expected_value: m.expected_value,
        reason: m.reason,
      },
      watchlists: m.contests.watchlists,
    })) as ContestWithMatch[];
}

async function refreshMatches(userId: string) {
  "use server";
  await computeAllMatchesForUser(userId);
}

export default async function RecommendationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const authUser = await requireAuth();
  const sort = (searchParams.sort as SortOption) ?? "recommended";

  const [profile, contests] = await Promise.all([
    getUserProfile(authUser.id).catch(() => null),
    getRecommendations(authUser.id, sort),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">AIおすすめ</h1>
          <p className="text-muted-foreground mt-1">
            あなたのプロフィールに基づくパーソナルレコメンド
          </p>
        </div>
        <form action={refreshMatches.bind(null, authUser.id)}>
          <Button type="submit" variant="outline" size="sm" className="gap-1.5">
            <Brain className="h-4 w-4" />
            再計算
          </Button>
        </form>
      </div>

      {!profile?.onboarded && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm">
          <strong>プロフィールを完成させてください</strong> — スキル・言語・カテゴリを登録するとより精度の高いレコメンドが得られます。
        </div>
      )}

      {/* Sort tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {SORT_OPTIONS.map((opt) => (
          <a
            key={opt.value}
            href={`?sort=${opt.value}`}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              sort === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </a>
        ))}
      </div>

      {contests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contests.map((contest) => (
            <ContestCard
              key={contest.id}
              contest={contest}
              showMatch
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <span className="text-5xl mb-4 block">🦉</span>
          <p className="text-lg font-medium mb-2">おすすめ案件を計算中...</p>
          <p className="text-muted-foreground text-sm mb-6">
            プロフィールを設定するとAIがあなたに合った案件を見つけます
          </p>
          <form action={refreshMatches.bind(null, authUser.id)}>
            <Button type="submit" variant="gradient">
              <Brain className="h-4 w-4 mr-2" />
              今すぐ計算する
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

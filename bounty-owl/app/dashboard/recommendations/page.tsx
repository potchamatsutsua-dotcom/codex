import { Brain } from "lucide-react";
import { ContestCard } from "@/components/contest/ContestCard";
import { requireAuth } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/db/client";
import { getUserProfile } from "@/lib/db/users";
import { computeAllMatchesForUser } from "@/lib/ai/matcher";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";
import type { ContestWithMatch, SortOption } from "@/types";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "マッチ度順" },
  { value: "win_probability", label: "勝率順" },
  { value: "expected_value", label: "期待収益順" },
  { value: "prize", label: "賞金順" },
  { value: "deadline", label: "締切順" },
];

async function getRecommendations(userId: string, sort: SortOption): Promise<ContestWithMatch[]> {
  const query = supabaseAdmin
    .from("user_matches")
    .select(`
      match_score, win_probability, expected_value, reason,
      contests!inner(*, contest_analysis(*), watchlists(id))
    `)
    .eq("user_id", userId)
    .gte("match_score", 30)
    .eq("contests.status", "active")
    .order(
      sort === "win_probability" ? "win_probability"
      : sort === "expected_value" ? "expected_value"
      : "match_score",
      { ascending: false }
    )
    .limit(30);

  const { data } = await query;
  if (!data) return [];

  return data
    .filter((m) => m.contests)
    .map((m) => ({
      ...(m.contests as unknown as Record<string, unknown>),
      contest_analysis: (m.contests as { contest_analysis?: unknown[] }).contest_analysis?.[0] ?? null,
      user_matches: {
        match_score: m.match_score,
        win_probability: m.win_probability,
        expected_value: m.expected_value,
        reason: m.reason,
      },
      watchlists: (m.contests as { watchlists?: unknown[] }).watchlists,
    } as ContestWithMatch));
}

async function refreshMatchesAction() {
  "use server";
  const { createSupabaseServerClient } = await import("@/lib/auth/server");
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await computeAllMatchesForUser(user.id);
  revalidatePath("/dashboard/recommendations");
}

interface SearchParams { sort?: string }

export default async function RecommendationsPage({ searchParams }: { searchParams: SearchParams }) {
  const authUser = await requireAuth();
  const sort = (searchParams.sort as SortOption) ?? "recommended";

  const [profile, contests] = await Promise.all([
    getUserProfile(authUser.id).catch(() => null),
    getRecommendations(authUser.id, sort),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black">✨ AIおすすめ</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            あなたのプロフィールに基づくパーソナルレコメンド
          </p>
        </div>
        <form action={refreshMatchesAction}>
          <Button type="submit" variant="outline" size="sm" className="gap-1.5">
            <Brain className="h-4 w-4" />
            再計算
          </Button>
        </form>
      </div>

      {!profile?.onboarded && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 px-4 py-3 text-sm">
          <strong>プロフィールを完成させてください</strong> —
          スキル・言語・カテゴリを登録するとより精度の高いレコメンドが得られます。
          <a href="/dashboard/profile" className="ml-1 text-amber-600 dark:text-amber-400 underline">設定する →</a>
        </div>
      )}

      {/* Sort tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {SORT_OPTIONS.map((opt) => (
          <a
            key={opt.value}
            href={`?sort=${opt.value}`}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              sort === opt.value
                ? "bg-amber-500 text-white"
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
            <ContestCard key={contest.id} contest={contest} showMatch />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <span className="text-5xl mb-4 block">🦉</span>
          <p className="text-lg font-black mb-2">おすすめ案件を計算中...</p>
          <p className="text-muted-foreground text-sm mb-6">
            プロフィールを設定するとAIがあなたに合った案件を見つけます
          </p>
          <form action={refreshMatchesAction}>
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

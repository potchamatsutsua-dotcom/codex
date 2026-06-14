import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Trophy, Bookmark, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContestCard } from "@/components/contest/ContestCard";
import { OnboardingWizard } from "@/components/profile/OnboardingWizard";
import { requireAuth } from "@/lib/auth/server";
import { getUserById, getUserProfile } from "@/lib/db/users";
import { getContestStats } from "@/lib/db/contests";
import { getWatchlistCount } from "@/lib/db/watchlist";
import { supabaseAdmin } from "@/lib/db/client";
import { formatCurrency } from "@/lib/utils";
import type { ContestWithMatch, ExperienceLevel } from "@/types";

interface OnboardingData {
  country: string;
  languages: string[];
  categories: string[];
  experience_level: ExperienceLevel;
  skills: string;
}

async function completeOnboarding(data: OnboardingData) {
  "use server";

  const { createSupabaseServerClient } = await import("@/lib/auth/server");
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const skillsList = data.skills
    .split(/[,、\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

  await Promise.all([
    supabaseAdmin
      .from("users")
      .update({ country: data.country, language: data.languages[0] ?? "ja" })
      .eq("id", user.id),
    supabaseAdmin
      .from("profiles")
      .update({
        languages: data.languages,
        categories: data.categories,
        experience_level: data.experience_level,
        skills: skillsList,
        onboarded: true,
      })
      .eq("user_id", user.id),
  ]);

  redirect("/dashboard");
}

export default async function DashboardPage() {
  const authUser = await requireAuth();

  const [user, profile, stats, watchlistCount] = await Promise.all([
    getUserById(authUser.id),
    getUserProfile(authUser.id).catch(() => null),
    getContestStats(),
    getWatchlistCount(authUser.id),
  ]);

  if (!profile?.onboarded) {
    return <OnboardingWizard onComplete={completeOnboarding} />;
  }

  const { data: matchData } = await supabaseAdmin
    .from("user_matches")
    .select(`match_score, win_probability, expected_value, reason, contests(*, contest_analysis(*), watchlists(id))`)
    .eq("user_id", authUser.id)
    .gte("match_score", 40)
    .order("match_score", { ascending: false })
    .limit(6);

  const contests: ContestWithMatch[] = (matchData ?? [])
    .filter((m) => m.contests)
    .map((m) => ({
      ...(m.contests as unknown as Record<string, unknown>),
      contest_analysis:
        (m.contests as { contest_analysis?: unknown[] }).contest_analysis?.[0] ?? null,
      user_matches: {
        match_score: m.match_score,
        win_probability: m.win_probability,
        expected_value: m.expected_value,
        reason: m.reason,
      },
      watchlists: (m.contests as { watchlists?: unknown[] }).watchlists,
    } as ContestWithMatch));

  const statCards = [
    { title: "応募可能", value: `${stats.total_active}件`, icon: Zap, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-950/40" },
    { title: "総賞金額", value: formatCurrency(stats.total_prize_pool, "JPY"), icon: Trophy, color: "text-green-500", bg: "bg-green-100 dark:bg-green-950/40" },
    { title: "保存済み", value: `${watchlistCount}件`, icon: Bookmark, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-950/40" },
    { title: "本日追加", value: `${stats.new_today}件`, icon: TrendingUp, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-950/40" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black">
          おかえりなさい、{user.name ?? "賞金ハンター"}さん 👋
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">今日も最高の案件を見つけましょう</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <div className="text-xl font-black truncate">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.title}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black">✨ AIおすすめ</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/recommendations">
              すべて見る <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        {contests.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contests.map((contest) => (
              <ContestCard key={contest.id} contest={contest} showMatch />
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <span className="text-5xl">🦉</span>
              <div>
                <p className="font-semibold mb-1">まだレコメンドがありません</p>
                <p className="text-sm text-muted-foreground">
                  プロフィールを更新するとAIが案件をピックアップします
                </p>
              </div>
              <Button variant="gradient" size="sm" asChild>
                <Link href="/dashboard/profile">プロフィールを設定</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/dashboard/contests", emoji: "🏆", label: "コンテスト一覧" },
          { href: "/dashboard/recommendations", emoji: "✨", label: "おすすめ" },
          { href: "/dashboard/watchlist", emoji: "🔖", label: "保存済み" },
          { href: "/dashboard/profile", emoji: "⚙️", label: "設定" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted transition-colors text-sm font-medium"
          >
            <span className="text-xl">{item.emoji}</span>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowRight, Trophy, Bookmark, Zap, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContestCard } from "@/components/contest/ContestCard";
import { requireAuth } from "@/lib/auth/server";
import { getUserById, getUserProfile } from "@/lib/db/users";
import { getContests, getContestStats } from "@/lib/db/contests";
import { getWatchlistCount } from "@/lib/db/watchlist";
import { formatCurrency } from "@/lib/utils";
import { OnboardingWizard } from "@/components/profile/OnboardingWizard";
import { redirect } from "next/navigation";

async function completeOnboarding(data: {
  country: string;
  languages: string[];
  categories: string[];
  experience_level: string;
  skills: string;
}) {
  "use server";
  const { createSupabaseServerClient } = await import("@/lib/auth/server");
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { supabaseAdmin } = await import("@/lib/db/client");
  await supabaseAdmin.from("users").update({
    country: data.country,
    language: data.languages[0] ?? "ja",
  }).eq("id", user.id);

  await supabaseAdmin.from("profiles").update({
    languages: data.languages,
    categories: data.categories,
    experience_level: data.experience_level,
    skills: data.skills.split(/[,、\n]/).map((s) => s.trim()).filter(Boolean),
    onboarded: true,
  }).eq("user_id", user.id);

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

  const { contests } = await getContests({
    limit: 6,
    userId: authUser.id,
    sort: "recommended",
  });

  const statCards = [
    {
      title: "応募可能案件",
      value: stats.total_active.toLocaleString(),
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-100 dark:bg-amber-900/20",
    },
    {
      title: "総賞金額",
      value: formatCurrency(stats.total_prize_pool, "JPY"),
      icon: Trophy,
      color: "text-green-500",
      bg: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "保存済み案件",
      value: watchlistCount.toString(),
      icon: Bookmark,
      color: "text-blue-500",
      bg: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "本日追加",
      value: stats.new_today.toString(),
      icon: TrendingUp,
      color: "text-purple-500",
      bg: "bg-purple-100 dark:bg-purple-900/20",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">
          おかえりなさい、{user.name ?? "賞金ハンター"}さん 👋
        </h1>
        <p className="text-muted-foreground mt-1">今日も最高の案件を見つけましょう</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="text-xl font-bold truncate">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.title}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">AIおすすめ案件</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/recommendations">
              すべて見る
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
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
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <span className="text-4xl mb-4">🦉</span>
              <p className="text-muted-foreground">
                プロフィールを更新すると、あなたに合った案件をおすすめします
              </p>
              <Button variant="gradient" className="mt-4" asChild>
                <Link href="/dashboard/profile">プロフィールを設定</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

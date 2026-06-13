import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { getContests } from "@/lib/db/contests";
import { getCategoryLabel, formatCurrency, formatRelativeDate, getCategoryColor, cn } from "@/lib/utils";
import { notFound } from "next/navigation";
import type { FilterCategory } from "@/types";

const VALID_CATEGORIES: FilterCategory[] = [
  "novel", "illustration", "programming", "ai", "photography",
  "video", "design", "startup", "research", "scholarship",
];

interface Props {
  params: { category: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = params.category as FilterCategory;
  if (!VALID_CATEGORIES.includes(category)) return {};

  const label = getCategoryLabel(category);
  return {
    title: `${label}コンテスト一覧 | Bounty Owl`,
    description: `${label}分野のコンテスト・公募・賞レース一覧。AIが勝率と期待収益を分析します。`,
    openGraph: {
      title: `${label}コンテスト一覧 | Bounty Owl`,
      description: `${label}分野のコンテスト・公募・賞レース一覧。`,
    },
  };
}

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({ category }));
}

export default async function ContestCategoryPage({ params }: Props) {
  const category = params.category as FilterCategory;
  if (!VALID_CATEGORIES.includes(category)) notFound();

  const { contests } = await getContests({ category, limit: 20, sort: "deadline" });
  const label = getCategoryLabel(category);

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <Link href="/" className="hover:text-foreground">ホーム</Link>
            <span>/</span>
            <span>コンテスト</span>
            <span>/</span>
            <span className="text-foreground font-medium">{label}</span>
          </div>
          <h1 className="text-3xl font-bold">{label}コンテスト一覧</h1>
          <p className="text-muted-foreground mt-2">
            {contests.length}件のアクティブな{label}コンテスト・公募・賞レース
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {contests.map((contest) => (
            <Card key={contest.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getCategoryColor(category))}>
                  {label}
                </span>
                <h2 className="font-semibold mt-2 mb-1 line-clamp-2">{contest.title}</h2>
                {contest.organizer && (
                  <p className="text-xs text-muted-foreground mb-3">{contest.organizer}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                    <Trophy className="h-3.5 w-3.5" />
                    {formatCurrency(contest.prize_amount, contest.currency)}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {formatRelativeDate(contest.deadline)}
                  </span>
                </div>
                <Button variant="gradient" size="sm" className="w-full mt-3 h-8 text-xs" asChild>
                  <Link href={`/dashboard/contests/${contest.id}`}>
                    詳細を見る
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* SEO content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h2>{label}コンテストで稼ぐ方法</h2>
          <p>
            Bounty Owlでは{label}分野のコンテスト情報を毎日自動収集しています。
            AIがあなたのスキル・経験レベルに基づいて最適な案件を提案し、
            勝率と期待収益を計算します。
          </p>
          <p>
            無料アカウントを作成してプロフィールを設定するだけで、
            AIがあなたに最適な{label}コンテストをレコメンドします。
          </p>
        </div>

        <div className="mt-8 text-center">
          <Button variant="gradient" size="lg" asChild>
            <Link href="/signup">
              無料でAIレコメンドを受け取る
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

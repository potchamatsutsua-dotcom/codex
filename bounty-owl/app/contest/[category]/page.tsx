import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getContests } from "@/lib/db/contests";
import { getCategoryLabel, formatCurrency, formatRelativeDate, getCategoryColor, cn } from "@/lib/utils";
import { notFound } from "next/navigation";
import type { FilterCategory } from "@/types";

const VALID_CATEGORIES: FilterCategory[] = [
  "novel", "illustration", "programming", "ai", "photography",
  "video", "design", "startup", "research", "scholarship",
];

interface Props { params: { category: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = params.category as FilterCategory;
  if (!VALID_CATEGORIES.includes(category)) return {};
  const label = getCategoryLabel(category);
  return {
    title: `${label}コンテスト一覧`,
    description: `${label}分野のコンテスト・公募・賞レース一覧。AIが勝率と期待収益を分析します。`,
  };
}

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({ category }));
}

export default async function ContestCategoryPage({ params }: Props) {
  const category = params.category as FilterCategory;
  if (!VALID_CATEGORIES.includes(category)) notFound();

  const { contests } = await getContests({ category, limit: 24, sort: "deadline" });
  const label = getCategoryLabel(category);

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-foreground transition-colors">ホーム</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{label}コンテスト</span>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black mb-2">
          {label}コンテスト一覧
        </h1>
        <p className="text-muted-foreground">
          {contests.length}件のアクティブな{label}コンテスト・公募・賞レース
        </p>
      </div>

      {contests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {contests.map((contest) => (
            <div
              key={contest.id}
              className="bg-card rounded-2xl border overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className={cn("h-1", getCategoryAccentClass(category))} />
              <div className="p-4">
                <span className={cn("inline-block text-xs font-semibold px-2 py-0.5 rounded-md mb-2", getCategoryColor(category))}>
                  {label}
                </span>
                <h2 className="font-bold text-sm leading-snug mb-1 line-clamp-2">{contest.title}</h2>
                {contest.organizer && (
                  <p className="text-xs text-muted-foreground mb-3 truncate">{contest.organizer}</p>
                )}
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                    <Trophy className="h-3.5 w-3.5" />
                    {formatCurrency(contest.prize_amount, contest.currency)}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground text-xs">
                    <Clock className="h-3 w-3" />
                    {formatRelativeDate(contest.deadline)}
                  </span>
                </div>
                <Button variant="gradient" size="sm" className="w-full h-8 text-xs" asChild>
                  <Link href={`/dashboard/contests/${contest.id}`}>
                    詳細・応募
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🦉</div>
          <p className="text-muted-foreground">現在{label}のコンテストは登録されていません</p>
        </div>
      )}

      {/* SEO text */}
      <div className="mt-4 p-6 bg-muted/40 rounded-2xl text-sm text-muted-foreground leading-relaxed space-y-2">
        <h2 className="font-bold text-base text-foreground">{label}コンテストで稼ぐ方法</h2>
        <p>
          Bounty Owlでは{label}分野のコンテスト情報を毎日AIが自動収集しています。
          アカウントを作成してプロフィールを設定すると、AIがあなたのスキル・経験・言語に基づいて
          勝率と期待収益を計算したレコメンドを提供します。
        </p>
        <div className="mt-3">
          <Button variant="gradient" asChild>
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

function getCategoryAccentClass(category: string): string {
  const map: Record<string, string> = {
    novel: "bg-amber-400",
    illustration: "bg-pink-400",
    programming: "bg-blue-500",
    ai: "bg-purple-500",
    photography: "bg-green-500",
    video: "bg-red-500",
    design: "bg-orange-400",
    startup: "bg-indigo-500",
    research: "bg-teal-500",
    scholarship: "bg-cyan-500",
  };
  return map[category] ?? "bg-gray-400";
}

import Link from "next/link";
import { ArrowLeft, ExternalLink, Trophy, Clock, Users, Star, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireAuth } from "@/lib/auth/server";
import { getContestById } from "@/lib/db/contests";
import { getUserProfile, getSubscription } from "@/lib/db/users";
import {
  cn,
  formatCurrency,
  formatDate,
  formatRelativeDate,
  formatWinProbability,
  getCategoryColor,
  getCategoryLabel,
  getDifficultyStars,
} from "@/lib/utils";
import { notFound } from "next/navigation";

export default async function ContestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const authUser = await requireAuth();

  const [contest, subscription] = await Promise.all([
    getContestById(params.id, authUser.id).catch(() => null),
    getSubscription(authUser.id).catch(() => null),
  ]);

  if (!contest) notFound();

  const isPremium = subscription?.plan === "premium";
  const analysis = contest.contest_analysis;
  const match = contest.user_matches;
  const difficultyStars = getDifficultyStars(analysis?.difficulty_score ?? null);

  const deadlineSoon =
    contest.deadline &&
    new Date(contest.deadline).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/contests">
            <ArrowLeft className="h-4 w-4" />
            一覧に戻る
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={cn("text-sm px-3 py-1 rounded-full font-medium", getCategoryColor(contest.category))}>
                {getCategoryLabel(contest.category)}
              </span>
              {deadlineSoon && <Badge variant="destructive">締切間近</Badge>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">{contest.title}</h1>
            {contest.organizer && (
              <p className="text-muted-foreground mt-1">主催：{contest.organizer}</p>
            )}
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-4 w-4 text-amber-500" />
                <span className="text-xs text-muted-foreground">賞金</span>
              </div>
              <div className="font-bold text-lg text-amber-600 dark:text-amber-400">
                {formatCurrency(contest.prize_amount, contest.currency)}
              </div>
            </CardContent>
          </Card>

          <Card className={cn("border-0", deadlineSoon ? "bg-red-50 dark:bg-red-950/20" : "bg-muted/50")}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">締切</span>
              </div>
              <div className={cn("font-bold text-lg", deadlineSoon ? "text-red-500" : "")}>
                {formatRelativeDate(contest.deadline)}
              </div>
              <div className="text-xs text-muted-foreground">{formatDate(contest.deadline)}</div>
            </CardContent>
          </Card>

          {contest.estimated_entries && (
            <Card className="border-0 bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">推定参加者</span>
                </div>
                <div className="font-bold text-lg">
                  {contest.estimated_entries.toLocaleString()}件
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">難易度</span>
              </div>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < difficultyStars
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30"
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Button variant="gradient" size="lg" className="w-full sm:w-auto" asChild>
          <a href={contest.official_url} target="_blank" rel="noopener noreferrer">
            公式サイトで応募する
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          {contest.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">コンテスト詳細</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {contest.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* AI Summary */}
          {analysis?.ai_summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  🤖 AI要約
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{analysis.ai_summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Success Patterns */}
          {analysis?.success_patterns && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">攻略パターン</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{analysis.success_patterns}</p>
              </CardContent>
            </Card>
          )}

          {/* Strategy Report (Premium) */}
          <Card className={cn(!isPremium && "opacity-80")}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {isPremium ? "🎯" : <Lock className="h-4 w-4 text-amber-500" />}
                AI攻略レポート
                {!isPremium && <Badge variant="warning" className="ml-auto">Premium限定</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isPremium ? (
                <Button variant="gradient" className="w-full">
                  攻略レポートを生成する
                </Button>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Premiumプランで以下の分析が利用可能：
                  </p>
                  <ul className="text-sm text-left space-y-1 mb-4">
                    {["この賞で評価される傾向", "過去受賞者の共通点", "落選しやすい要素", "あなたへの改善ポイント"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-amber-500">✦</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button variant="gradient" asChild>
                    <Link href="/pricing">Premiumにアップグレード</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Match Score */}
          {match && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">あなたのマッチ度</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">マッチスコア</span>
                    <span className="font-bold text-primary">{match.match_score}%</span>
                  </div>
                  <Progress value={match.match_score ?? 0} className="h-2" />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">勝率</span>
                    <span className="font-medium">{formatWinProbability(match.win_probability)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">期待収益</span>
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      {formatCurrency(match.expected_value, contest.currency)}
                    </span>
                  </div>
                </div>
                {match.reason && (
                  <p className="text-xs text-muted-foreground border-t pt-2">{match.reason}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">コンテスト情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {contest.languages?.length > 0 && (
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <div className="text-muted-foreground text-xs">対応言語</div>
                    <div>{contest.languages.join(", ").toUpperCase()}</div>
                  </div>
                </div>
              )}
              {contest.country && (
                <div className="flex items-start gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <div className="text-muted-foreground text-xs">対象地域</div>
                    <div>{contest.country === "JP" ? "日本" : contest.country}</div>
                  </div>
                </div>
              )}
              {contest.entry_fee > 0 && (
                <div>
                  <div className="text-muted-foreground text-xs">参加費</div>
                  <div>{formatCurrency(contest.entry_fee, contest.currency)}</div>
                </div>
              )}
              {contest.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {contest.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { requireAdmin } from "@/lib/auth/server";
import { getAdminStats } from "@/lib/db/users";
import { getContestStats } from "@/lib/db/contests";
import { supabaseAdmin } from "@/lib/db/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Users, Trophy, DollarSign, TrendingUp, Database, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  await requireAdmin();

  const [userStats, contestStats, crawlerLogs] = await Promise.all([
    getAdminStats(),
    getContestStats(),
    supabaseAdmin
      .from("crawler_logs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(5)
      .then((r) => r.data ?? []),
  ]);

  const statCards = [
    {
      title: "総ユーザー数",
      value: userStats.total_users.toLocaleString(),
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "有料ユーザー",
      value: userStats.paying_users.toLocaleString(),
      icon: DollarSign,
      color: "text-green-500",
      bg: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "MRR",
      value: `¥${userStats.mrr.toLocaleString()}`,
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-100 dark:bg-amber-900/20",
    },
    {
      title: "登録コンテスト",
      value: contestStats.total_active.toLocaleString(),
      icon: Trophy,
      color: "text-purple-500",
      bg: "bg-purple-100 dark:bg-purple-900/20",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🦉</span>
          <div>
            <h1 className="font-bold text-lg">管理画面</h1>
            <p className="text-xs text-muted-foreground">Bounty Owl Admin</p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">ダッシュボードへ</Link>
        </Button>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center mb-3`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.title}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-amber-500" />
                カテゴリ別コンテスト数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(contestStats.by_category ?? {})
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{category}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full"
                            style={{
                              width: `${Math.min(100, ((count as number) / contestStats.total_active) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count as number}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Country breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                国別ユーザー数
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(userStats.users_by_country)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 8)
                  .map(([country, count]) => (
                    <div key={country} className="flex items-center justify-between">
                      <span className="text-sm">{country === "unknown" ? "不明" : country}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${Math.min(100, (count / userStats.total_users) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Crawler logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              クローラーログ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {crawlerLogs.length > 0 ? (
              <div className="space-y-2">
                {crawlerLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm"
                  >
                    <div>
                      <span className="font-medium">{log.source}</span>
                      <span className="text-muted-foreground ml-2">
                        {new Date(log.started_at).toLocaleString("ja-JP")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground">発見: {log.contests_found ?? 0}</span>
                      <Badge variant={log.contests_added > 0 ? "success" : "secondary"}>
                        追加: {log.contests_added ?? 0}
                      </Badge>
                      {log.finished_at ? (
                        <Badge variant="success">完了</Badge>
                      ) : (
                        <Badge variant="warning">実行中</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">クローラーログがありません</p>
            )}

            <form
              action="/api/crawler"
              method="POST"
              className="mt-4"
            >
              <Button type="submit" variant="outline" size="sm">
                手動クロール実行
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

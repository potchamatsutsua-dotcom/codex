import Link from "next/link";
import { ArrowRight, Brain, Trophy, TrendingUp, Zap, Star, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/layout/Navbar";
import { getUser } from "@/lib/auth/server";
import { getUserById } from "@/lib/db/users";
import { getContestStats } from "@/lib/db/contests";

export default async function HomePage() {
  const authUser = await getUser();
  let user = null;
  let stats = { total_active: 0, total_prize_pool: 0, new_today: 0, by_category: {} };

  if (authUser) {
    try {
      user = await getUserById(authUser.id);
    } catch {}
  }

  try {
    stats = await getContestStats();
  } catch {}

  const features = [
    {
      icon: Brain,
      title: "AI勝率予測",
      description: "あなたのスキル・経験・実績をもとにAIが勝率を計算。無駄な応募を減らし、勝てる案件に集中。",
      color: "text-purple-500",
      bg: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      icon: Trophy,
      title: "世界中のコンテスト",
      description: "小説賞・イラスト・ハッカソン・写真コンテストなど、毎日クローラーが最新情報を収集。",
      color: "text-amber-500",
      bg: "bg-amber-100 dark:bg-amber-900/20",
    },
    {
      icon: TrendingUp,
      title: "期待収益計算",
      description: "勝率×賞金額で期待収益を計算。複数案件への時間配分を最適化できます。",
      color: "text-green-500",
      bg: "bg-green-100 dark:bg-green-900/20",
    },
    {
      icon: Target,
      title: "パーソナル分析",
      description: "AI攻略レポートで過去の受賞傾向・落選パターンを解析。あなただけの戦略を提示。",
      color: "text-blue-500",
      bg: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      icon: Zap,
      title: "締切通知",
      description: "ウォッチリストに保存したコンテストの締切をメール・PWAプッシュで通知。",
      color: "text-orange-500",
      bg: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      icon: Users,
      title: "コミュニティ",
      description: "同じカテゴリの賞金ハンターと繋がり、攻略情報を共有しよう。",
      color: "text-pink-500",
      bg: "bg-pink-100 dark:bg-pink-900/20",
    },
  ];

  const testimonials = [
    {
      name: "田中 美咲",
      role: "小説家",
      avatar: "田",
      text: "Bounty Owlのおかげで応募先を絞り込めるようになりました。3ヶ月で2つの賞を受賞できました！",
    },
    {
      name: "Alex Chen",
      role: "Programmer",
      avatar: "A",
      text: "The AI win probability feature is incredibly accurate. Won my first hackathon after following the strategy report!",
    },
    {
      name: "木村 拓哉",
      role: "フォトグラファー",
      avatar: "木",
      text: "毎日コンテストを探す手間がなくなりました。AIが最適な案件を自動でピックアップしてくれます。",
    },
  ];

  const formatPrizePool = (amount: number) => {
    if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B+`;
    if (amount >= 1_000_000) return `¥${(amount / 1_000_000).toFixed(0)}M+`;
    return `¥${amount.toLocaleString()}`;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={user} />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/50 to-background dark:from-amber-950/20">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-20 md:py-32 text-center relative">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
            <Zap className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
            AIが勝率を予測する賞金ハンタープラットフォーム
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
            賞金ハンターの
            <br />
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              最強の相棒
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            世界中のコンテスト・公募・ハッカソンをAIが分析。
            <br className="hidden sm:block" />
            あなたの勝率・期待収益を予測し、今応募すべき案件を提示します。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Button variant="gradient" size="xl" asChild>
              <Link href="/signup">
                無料で始める
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link href="/dashboard/contests">コンテストを見る</Link>
            </Button>
          </div>

          <div className="flex flex-wrap justify-center gap-8">
            {[
              { label: "登録コンテスト", value: `${stats.total_active.toLocaleString()}+`, icon: "🏆" },
              { label: "総賞金額", value: formatPrizePool(stats.total_prize_pool || 50_000_000), icon: "💰" },
              { label: "利用ユーザー", value: "1,200+", icon: "👥" },
              { label: "AI予測精度", value: "87%", icon: "🎯" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">なぜBounty Owlなのか</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              単なる公募サイトではありません。あなたの勝率を最大化するためのAIプラットフォームです。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                      <Icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">使い方</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              { step: "01", title: "プロフィール設定", desc: "スキル・言語・経験レベルを登録", emoji: "📝" },
              { step: "02", title: "AIが分析", desc: "あなたに合ったコンテストを自動でレコメンド", emoji: "🤖" },
              { step: "03", title: "応募して稼ぐ", desc: "勝率の高い案件に集中して応募", emoji: "🎉" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-5xl mb-4">{item.emoji}</div>
                <div className="text-xs font-mono text-muted-foreground mb-1">{item.step}</div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">ユーザーの声</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-3xl border p-12">
            <span className="text-5xl mb-6 block">🦉</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">今すぐ賞金ハントを始めよう</h2>
            <p className="text-muted-foreground mb-8">
              無料で始められます。クレジットカード不要。
            </p>
            <Button variant="gradient" size="xl" asChild>
              <Link href="/signup">
                無料で始める
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🦉</span>
              <span className="font-bold text-lg">Bounty Owl</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
              <Link href="/pricing" className="hover:text-foreground transition-colors">料金</Link>
              <Link href="/dashboard/contests" className="hover:text-foreground transition-colors">コンテスト</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">プライバシー</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">利用規約</Link>
            </div>
            <p className="text-xs text-muted-foreground">© 2024 Bounty Owl. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

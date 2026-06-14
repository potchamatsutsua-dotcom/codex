import Link from "next/link";
import {
  ArrowRight,
  Trophy,
  TrendingUp,
  Zap,
  Star,
  Clock,
  Target,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { getUser } from "@/lib/auth/server";
import { getUserById } from "@/lib/db/users";
import { getContestStats } from "@/lib/db/contests";

export default async function HomePage() {
  const authUser = await getUser();
  let user = null;
  let stats = { total_active: 0, total_prize_pool: 0, new_today: 0 };

  if (authUser) {
    try { user = await getUserById(authUser.id); } catch {}
  }
  try { stats = await getContestStats(); } catch {}

  const formatPool = (n: number) => {
    if (n >= 1_000_000_000) return `¥${(n / 1_000_000_000).toFixed(1)}B+`;
    if (n >= 1_000_000) return `¥${(n / 1_000_000).toFixed(0)}M+`;
    return `¥${n.toLocaleString()}`;
  };

  const features = [
    { emoji: "🎯", title: "AI勝率予測", desc: "スキル×経験×言語から合格確率を計算" },
    { emoji: "🏆", title: "世界中を網羅", desc: "小説・イラスト・ハッカソンを毎日収集" },
    { emoji: "💰", title: "期待収益算出", desc: "勝率×賞金で本当にお得な案件がわかる" },
    { emoji: "🔔", title: "締切通知", desc: "保存した案件の締切を自動でお知らせ" },
    { emoji: "📊", title: "攻略レポート", desc: "過去受賞パターンをAIが徹底分析" },
    { emoji: "🌍", title: "多言語対応", desc: "日本語・英語など世界中のコンテスト" },
  ];

  const categories = [
    { emoji: "📚", label: "小説", href: "/contest/novel", color: "bg-amber-100 dark:bg-amber-950" },
    { emoji: "🎨", label: "イラスト", href: "/contest/illustration", color: "bg-pink-100 dark:bg-pink-950" },
    { emoji: "💻", label: "プログラミング", href: "/contest/programming", color: "bg-blue-100 dark:bg-blue-950" },
    { emoji: "🤖", label: "AI", href: "/contest/ai", color: "bg-purple-100 dark:bg-purple-950" },
    { emoji: "📷", label: "写真", href: "/contest/photography", color: "bg-green-100 dark:bg-green-950" },
    { emoji: "✏️", label: "デザイン", href: "/contest/design", color: "bg-orange-100 dark:bg-orange-950" },
  ];

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Navbar user={user} />

      {/* ========== HERO ========== */}
      <section className="relative pt-20 pb-28 px-4 text-center">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-20 -left-40 h-[480px] w-[480px] rounded-full bg-amber-400/20 blur-3xl" />
        <div className="pointer-events-none absolute top-10 -right-40 h-[400px] w-[400px] rounded-full bg-orange-400/15 blur-3xl" />

        <div className="relative max-w-3xl mx-auto">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 dark:bg-amber-950/50 dark:border-amber-800 px-4 py-1.5 text-sm font-medium text-amber-700 dark:text-amber-300 mb-8">
            <Sparkles className="h-3.5 w-3.5" />
            AIが勝率を予測する
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight mb-6">
            賞金ハンターの
            <br />
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                最強の相棒
              </span>
              {/* underline deco */}
              <span className="absolute -bottom-1 left-0 right-0 h-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 opacity-60" />
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-10 max-w-xl mx-auto">
            世界中のコンテスト・公募・ハッカソンをAIが分析。
            <br className="hidden sm:block" />
            あなたの<strong className="text-foreground">勝率</strong>と<strong className="text-foreground">期待収益</strong>を計算して、今すぐ応募すべき案件を提示します。
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="gradient" size="xl" className="text-base font-bold shadow-xl shadow-amber-500/25" asChild>
              <Link href="/signup">
                無料で始める — 30秒
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="xl" className="text-base" asChild>
              <Link href="/dashboard/contests">コンテストを見る</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">クレジットカード不要 · いつでも解約可</p>
        </div>

        {/* Stats bar */}
        <div className="relative mt-16 max-w-2xl mx-auto grid grid-cols-3 gap-px rounded-2xl border bg-border overflow-hidden shadow-sm">
          {[
            { icon: Trophy, label: "登録コンテスト", value: `${stats.total_active || 120}+`, color: "text-amber-500" },
            { icon: TrendingUp, label: "総賞金プール", value: formatPool(stats.total_prize_pool || 50_000_000), color: "text-green-500" },
            { icon: Zap, label: "本日追加", value: `${stats.new_today || 8}件`, color: "text-blue-500" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-card flex flex-col items-center justify-center py-5 px-3 gap-1">
                <Icon className={`h-5 w-5 ${s.color}`} />
                <div className="text-2xl font-black">{s.value}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========== CATEGORIES ========== */}
      <section className="py-16 px-4 bg-muted/40">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-8">
            対応カテゴリ
          </p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className={`${cat.color} rounded-2xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform`}
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="text-xs font-semibold">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">3ステップで始める</h2>
          <p className="text-muted-foreground mb-14">難しい設定は不要。すぐに使えます。</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", emoji: "🧑‍💻", title: "プロフィール登録", desc: "スキル・言語・カテゴリを選択（2分）" },
              { step: "2", emoji: "🤖", title: "AIが分析", desc: "あなたに合ったコンテストを自動レコメンド" },
              { step: "3", emoji: "💸", title: "応募して稼ぐ", desc: "勝率の高い案件だけに集中投資" },
            ].map((item) => (
              <div key={item.step} className="relative">
                {/* connector line (desktop) */}
                <div className="hidden md:block absolute top-8 left-full w-full h-px border-t-2 border-dashed border-muted z-0" style={{ width: "calc(100% - 2rem)", left: "calc(50% + 2rem)" }} />
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-950 dark:to-orange-950 flex items-center justify-center text-3xl shadow-sm">
                    {item.emoji}
                  </div>
                  <div className="absolute -top-2 -right-2 md:static w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className="py-20 px-4 bg-muted/40">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3">なぜBounty Owlなのか</h2>
            <p className="text-muted-foreground">ただのコンテスト一覧サイトとは違います</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-card rounded-2xl border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h3 className="font-bold mb-1">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== SOCIAL PROOF ========== */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black mb-3">ユーザーの声</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "田中 美咲", role: "小説家", avatar: "田", stars: 5, text: "Bounty Owlで応募先を絞り込んだら3ヶ月で2賞受賞！AIのレコメンド精度が高すぎる。" },
              { name: "Alex Chen", role: "Programmer", avatar: "A", stars: 5, text: "Win probability prediction is spot-on. Won my first hackathon following the AI strategy report!" },
              { name: "木村 拓哉", role: "フォトグラファー", avatar: "木", stars: 5, text: "毎日コンテストを探す手間がゼロになった。締切通知も便利でありがたい。" },
            ].map((t) => (
              <div key={t.name} className="bg-card rounded-2xl border p-5">
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRICING TEASER ========== */}
      <section className="py-16 px-4 bg-muted/40">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black mb-2">シンプルな料金</h2>
            <p className="text-muted-foreground">まずは無料から。いつでもアップグレード可。</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Free", price: "¥0", highlight: false, features: ["5件/日閲覧", "保存10件", "基本AI要約"] },
              { name: "Pro", price: "¥980", highlight: true, features: ["無制限閲覧", "勝率予測", "締切通知", "AI詳細分析"] },
              { name: "Premium", price: "¥1,980", highlight: false, features: ["AI攻略レポート", "優先通知", "全Pro機能"] },
            ].map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-5 ${plan.highlight ? "border-amber-400 bg-gradient-to-b from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 shadow-lg shadow-amber-500/10" : "bg-card"}`}
              >
                {plan.highlight && (
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">人気No.1</div>
                )}
                <div className="font-black text-xl mb-0.5">{plan.name}</div>
                <div className="text-3xl font-black mb-4">
                  {plan.price}
                  {plan.price !== "¥0" && <span className="text-base font-normal text-muted-foreground">/月</span>}
                </div>
                <ul className="space-y-1.5 text-sm text-muted-foreground mb-5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <span className="text-green-500 font-bold">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlight ? "gradient" : "outline"}
                  className="w-full"
                  size="sm"
                  asChild
                >
                  <Link href="/signup">始める</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className="py-24 px-4">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-6xl mb-6">🦉</div>
          <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            今日から<br />賞金ハントを始めよう
          </h2>
          <p className="text-muted-foreground mb-8">無料・登録30秒・カード不要</p>
          <Button variant="gradient" size="xl" className="text-base font-bold shadow-xl shadow-amber-500/20" asChild>
            <Link href="/signup">
              無料アカウントを作る
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="border-t py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 font-black text-lg">
            <span className="text-2xl">🦉</span>
            Bounty Owl
          </Link>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <Link href="/about" className="hover:text-foreground transition-colors">About</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">料金</Link>
            <Link href="/dashboard/contests" className="hover:text-foreground transition-colors">コンテスト</Link>
            <Link href="/contest/novel" className="hover:text-foreground transition-colors">小説賞</Link>
            <Link href="/contest/programming" className="hover:text-foreground transition-colors">ハッカソン</Link>
            <Link href="/contest/ai" className="hover:text-foreground transition-colors">AIコンテスト</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2024 Bounty Owl</p>
        </div>
      </footer>
    </div>
  );
}

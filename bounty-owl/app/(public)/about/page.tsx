import Link from "next/link";
import { ArrowRight, Target, Brain, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { getUser } from "@/lib/auth/server";
import { getUserById } from "@/lib/db/users";

export default async function AboutPage() {
  const authUser = await getUser();
  let user = null;
  if (authUser) {
    try { user = await getUserById(authUser.id); } catch {}
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-16">
          <span className="text-6xl mb-6 block">🦉</span>
          <h1 className="text-4xl font-bold mb-4">Bounty Owlについて</h1>
          <p className="text-xl text-muted-foreground">
            Find contests. Estimate win probability. Maximize expected earnings.
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
              <Target className="h-6 w-6 text-amber-500" />
              ミッション
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Bounty Owlは、世界中の賞金付きコンテスト・公募・ハッカソン・助成金を収集し、
              AIがユーザーごとの勝率・期待値・おすすめ度を分析するプラットフォームです。
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              単なる公募サイトではありません。ユーザーのスキル・実績・言語能力・居住国を分析し、
              「今応募すべき案件」を提示します。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
              <Brain className="h-6 w-6 text-purple-500" />
              AIの仕組み
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>私たちのMatch Engineは以下の要素でスコアリングします：</p>
              <ul className="list-none space-y-2">
                {[
                  { label: "スキルマッチ", weight: "40%", desc: "カテゴリと経験レベルの一致度" },
                  { label: "言語マッチ", weight: "20%", desc: "応募言語の対応状況" },
                  { label: "国籍要件", weight: "15%", desc: "応募資格の確認" },
                  { label: "経験マッチ", weight: "15%", desc: "難易度と経験レベルの相性" },
                  { label: "賞金優先度", weight: "10%", desc: "賞金額の規模感" },
                ].map((item) => (
                  <li key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <span className="font-mono text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-bold shrink-0 mt-0.5">
                      {item.weight}
                    </span>
                    <div>
                      <span className="font-medium text-foreground">{item.label}</span>
                      <span className="text-sm ml-2">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
              <Globe className="h-6 w-6 text-blue-500" />
              対象カテゴリ
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { emoji: "📚", label: "小説・文学賞" },
                { emoji: "🎨", label: "イラスト" },
                { emoji: "💻", label: "プログラミング" },
                { emoji: "🤖", label: "AI・機械学習" },
                { emoji: "📷", label: "写真" },
                { emoji: "🎬", label: "動画" },
                { emoji: "✏️", label: "デザイン" },
                { emoji: "🚀", label: "スタートアップ" },
                { emoji: "🔬", label: "研究助成金" },
              ].map((cat) => (
                <div key={cat.label} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm">
                  <span className="text-2xl">{cat.emoji}</span>
                  <span>{cat.label}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-16 text-center bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl border p-10">
          <h2 className="text-2xl font-bold mb-4">今すぐ始めよう</h2>
          <p className="text-muted-foreground mb-6">無料プランで今日から賞金ハントを開始</p>
          <Button variant="gradient" size="lg" asChild>
            <Link href="/signup">
              無料で始める
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

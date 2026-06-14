import Link from "next/link";
import { Check, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getUser } from "@/lib/auth/server";

export const metadata = {
  title: "料金プラン",
  description: "Bounty Owlの料金プラン。Free・Pro・Premiumの3プランからお選びください。",
};

export default async function PricingPage() {
  const authUser = await getUser();

  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      description: "まず試してみたい方へ",
      features: [
        "1日5件のコンテスト閲覧",
        "ウォッチリスト最大10件",
        "基本的なAI要約",
        "カテゴリ別フィルタ",
      ],
      limitations: [
        "AI攻略レポートなし",
        "勝率予測なし",
        "通知機能なし",
      ],
      cta: "無料で始める",
      ctaHref: "/signup",
      highlighted: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: 980,
      description: "本格的に賞金を狙う方へ",
      features: [
        "無制限のコンテスト閲覧",
        "ウォッチリスト無制限",
        "AI詳細分析",
        "勝率・期待収益予測",
        "締切メール通知",
        "PWAプッシュ通知",
        "おすすめソート機能",
        "全カテゴリアクセス",
      ],
      limitations: [],
      cta: "Proにアップグレード",
      ctaHref: "/dashboard/profile",
      highlighted: true,
    },
    {
      id: "premium",
      name: "Premium",
      price: 1980,
      description: "勝率を最大化したいプロへ",
      features: [
        "Proの全機能",
        "AI攻略レポート（無制限）",
        "優先通知（締切72時間前）",
        "過去受賞者パターン分析",
        "個人向け戦略アドバイス",
        "落選パターン警告",
        "優先サポート",
      ],
      limitations: [],
      cta: "Premiumにアップグレード",
      ctaHref: "/dashboard/profile",
      highlighted: false,
    },
  ] as const;

  const faqs = [
    {
      q: "無料プランでも使えますか？",
      a: "はい。無料プランでは1日5件までコンテストを閲覧でき、基本的なAI要約も利用できます。",
    },
    {
      q: "いつでもキャンセルできますか？",
      a: "はい。サブスクリプションはいつでもキャンセル可能で、支払済み期間の終了まで引き続きご利用いただけます。",
    },
    {
      q: "AI攻略レポートとは何ですか？",
      a: "Premiumプランでは、各コンテストの過去受賞傾向・落選パターン・あなたへの具体的な改善アドバイスをAIが生成します。",
    },
    {
      q: "勝率予測はどのくらい正確ですか？",
      a: "ユーザーのスキルレベル・経験・過去データをもとにAIが算出します。参考値としてご利用ください。",
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Zap className="h-3.5 w-3.5 mr-1 text-amber-500" />
            シンプルな料金体系
          </Badge>
          <h1 className="text-4xl font-bold mb-4">まずは無料で始めよう</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            クレジットカード不要。いつでもアップグレード・ダウングレード可能。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${plan.highlighted ? "border-primary shadow-lg shadow-primary/10 scale-105" : ""}`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-4">
                    人気No.1
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <div className="text-lg font-bold">{plan.name}</div>
                <div className="text-muted-foreground text-sm">{plan.description}</div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-extrabold">
                    {plan.price === 0 ? "無料" : `¥${plan.price.toLocaleString()}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground text-sm">/月</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant={plan.highlighted ? "gradient" : "outline"}
                  className="w-full"
                  asChild
                >
                  <Link href={authUser ? "/dashboard/profile" : "/signup"}>
                    {plan.cta}
                  </Link>
                </Button>

                <div className="space-y-2">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {plan.limitations.map((limitation) => (
                    <div key={limitation} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 shrink-0">✕</span>
                      <span>{limitation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">よくある質問</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <Card key={faq.q}>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-1.5">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

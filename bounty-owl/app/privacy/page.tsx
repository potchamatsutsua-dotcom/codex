import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
        ← ホームに戻る
      </Link>
      <h1 className="text-3xl font-black mb-8">プライバシーポリシー</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-base font-bold text-foreground mb-2">1. 収集する情報</h2>
          <p>
            Bounty Owlは、サービス提供のために以下の情報を収集します：
            アカウント登録時のメールアドレス・名前、プロフィール情報（スキル・言語・経験レベル）、
            サービス利用状況（閲覧・保存したコンテスト）、決済情報（Stripeが安全に管理）。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">2. 情報の利用目的</h2>
          <p>収集した情報は以下の目的で使用します：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>AIによるコンテストレコメンドの生成</li>
            <li>勝率・期待収益の計算</li>
            <li>締切通知の送信</li>
            <li>サービスの改善・新機能開発</li>
            <li>カスタマーサポートの提供</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">3. 第三者への提供</h2>
          <p>
            収集した個人情報は、法令に基づく場合を除き、第三者に提供しません。
            ただし、サービス運営のため以下のサービスを利用しています：
            Supabase（データベース）、Stripe（決済）、Anthropic/OpenAI（AI分析）、
            Vercel（ホスティング）、PostHog（分析）。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">4. Cookieの使用</h2>
          <p>
            認証状態の維持のためにCookieを使用します。
            ブラウザの設定からCookieを無効にできますが、一部機能が利用できなくなる場合があります。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">5. データの保管・削除</h2>
          <p>
            アカウント削除をご希望の場合は、プロフィール設定またはサポートまでお問い合わせください。
            削除後30日以内にすべての個人データを削除します。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">6. お問い合わせ</h2>
          <p>
            プライバシーに関するご質問は、support@bountyowl.com までご連絡ください。
          </p>
        </section>

        <p className="text-xs">最終更新：2024年12月</p>
      </div>
    </div>
  );
}

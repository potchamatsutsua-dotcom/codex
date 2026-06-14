import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "利用規約",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block">
        ← ホームに戻る
      </Link>
      <h1 className="text-3xl font-black mb-8">利用規約</h1>

      <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-base font-bold text-foreground mb-2">1. サービスの利用</h2>
          <p>
            Bounty Owl（以下「本サービス」）をご利用いただくことで、本規約に同意したものとみなします。
            本サービスは13歳以上の方にご利用いただけます。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">2. アカウント</h2>
          <p>
            アカウントの安全管理はユーザー自身の責任です。
            不正アクセスを発見した場合は直ちにご連絡ください。
            虚偽の情報での登録は禁止します。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">3. 禁止事項</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>スパム・嫌がらせ行為</li>
            <li>サービスへの不正アクセス・攻撃</li>
            <li>著作権を侵害するコンテンツの投稿</li>
            <li>商業目的でのデータのスクレイピング</li>
            <li>複数アカウントの作成（不正目的）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">4. AI分析の免責事項</h2>
          <p>
            本サービスが提供するAI勝率予測・期待収益計算はあくまで参考値です。
            実際の結果を保証するものではありません。
            コンテストへの応募はユーザー自身の判断と責任において行ってください。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">5. 料金・解約</h2>
          <p>
            有料プランの料金は月額前払いです。解約はいつでも可能で、
            支払済み期間の終了まで引き続きご利用いただけます。
            返金は原則お断りしておりますが、ご事情に応じて個別対応いたします。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">6. サービスの変更・終了</h2>
          <p>
            事前通知のうえサービス内容を変更・終了する場合があります。
            重大な変更の際は登録メールアドレスにお知らせします。
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-foreground mb-2">7. 準拠法</h2>
          <p>本規約は日本法に準拠し、東京地方裁判所を合意管轄裁判所とします。</p>
        </section>

        <p className="text-xs">最終更新：2024年12月</p>
      </div>
    </div>
  );
}

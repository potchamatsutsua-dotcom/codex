# 🦉 Bounty Owl - AI賞金ハンタープラットフォーム

> Find contests. Estimate win probability. Maximize expected earnings.

世界中のコンテスト・公募・ハッカソン・賞レースをAIが分析し、ユーザーごとの勝率・期待収益・おすすめ度を予測するSaaSプラットフォーム。

## 技術スタック

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, TypeScript, TailwindCSS, shadcn/ui |
| Backend | Next.js Server Actions / Route Handlers |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth (Email + Google OAuth) |
| AI | Anthropic Claude (analysis), OpenAI (fallback) |
| Crawler | Firecrawl API |
| Payments | Stripe |
| Hosting | Vercel |
| Analytics | PostHog |
| Monitoring | Sentry |
| Queue | Upstash Redis |
| i18n | next-intl (ja / en) |
| PWA | Service Worker + Web Push |

## セットアップ

### 1. 環境変数

```bash
cp .env.example .env.local
# 各サービスのAPIキーを設定
```

### 2. 依存パッケージのインストール

```bash
npm install
# または
pnpm install
```

### 3. Supabase セットアップ

1. [supabase.com](https://supabase.com) でプロジェクト作成
2. `supabase/migrations/001_initial.sql` をSupabase SQL Editorで実行
3. Authentication → Providers でGoogleを有効化
4. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` を設定

### 4. Stripe セットアップ

1. [stripe.com](https://stripe.com) でアカウント作成
2. Proプラン (¥980/月) と Premiumプラン (¥1980/月) の価格を作成
3. Webhook エンドポイント: `https://your-domain.com/api/stripe/webhook`
4. イベント: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`

### 5. 開発サーバー起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアクセス

## デプロイ (Vercel)

```bash
# Vercel CLIでデプロイ
npx vercel

# または GitHub連携でCI/CDを設定
```

環境変数をVercelダッシュボードで設定してください。

## フォルダ構成

```
bounty-owl/
├── app/
│   ├── (public)/          # ランディングページ・料金ページ
│   ├── dashboard/         # 認証済みユーザー画面
│   │   ├── contests/      # コンテスト一覧・詳細
│   │   ├── recommendations/ # AIレコメンド
│   │   ├── watchlist/     # ウォッチリスト
│   │   └── profile/       # プロフィール設定
│   ├── admin/             # 管理画面
│   ├── api/               # API Route Handlers
│   │   ├── auth/          # 認証API
│   │   ├── crawler/       # クローラーAPI
│   │   ├── stripe/        # Stripe API
│   │   ├── watchlist/     # ウォッチリストAPI
│   │   ├── recommendations/ # レコメンドAPI
│   │   └── analyze/       # AI分析API
│   ├── contest/[category]/ # SEO用カテゴリページ
│   ├── login/             # ログインページ
│   └── signup/            # 登録ページ
├── components/
│   ├── ui/                # 基本UIコンポーネント
│   ├── contest/           # コンテスト関連
│   ├── layout/            # レイアウト
│   └── profile/           # プロフィール
├── lib/
│   ├── ai/                # AIロジック (分析・マッチング)
│   ├── auth/              # 認証ヘルパー
│   ├── crawler/           # クローラー
│   ├── db/                # データベース操作
│   ├── stripe/            # Stripe操作
│   └── utils/             # ユーティリティ
├── supabase/
│   └── migrations/        # SQLマイグレーション
├── messages/              # i18n翻訳 (ja/en)
├── types/                 # TypeScript型定義
├── public/
│   ├── manifest.json      # PWAマニフェスト
│   └── sw.js              # Service Worker
└── vercel.json            # Vercel設定 (Cron含む)
```

## Match Engine アルゴリズム

```
match_score =
  skill_match    × 40%  (カテゴリ・経験レベル一致)
  language_match × 20%  (応募言語対応)
  country_check  × 15%  (国籍要件)
  experience     × 15%  (難易度 vs 経験レベル)
  prize_pref     × 10%  (賞金規模)

win_probability = (match_score / competitors) × difficulty_modifier
expected_value  = win_probability × prize_amount
```

## 料金プラン

| プラン | 価格 | 閲覧 | ウォッチリスト | AI分析 | 通知 | 攻略レポート |
|--------|------|------|--------------|--------|------|------------|
| Free | ¥0 | 5件/日 | 10件 | 基本 | ✕ | ✕ |
| Pro | ¥980/月 | 無制限 | 無制限 | 詳細 | ✓ | ✕ |
| Premium | ¥1,980/月 | 無制限 | 無制限 | 詳細 | 優先 | ✓ |

## Cron Jobs

`vercel.json` で毎日深夜2時にクローラーが自動実行されます。

手動実行:
```bash
node scripts/crawl.js --url http://localhost:3000
```

## セキュリティ

- Row Level Security (RLS) by Supabase
- CSRF protection via Next.js
- Stripe Webhook署名検証
- 入力バリデーション (Zod)
- セキュリティヘッダー設定済み
- 環境変数による機密情報管理

## ライセンス

MIT

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  country     TEXT,
  language    TEXT DEFAULT 'en',
  plan        TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own record" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own record" ON public.users FOR UPDATE USING (auth.uid() = id);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE public.profiles (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  bio              TEXT,
  skills           JSONB NOT NULL DEFAULT '[]',
  categories       JSONB NOT NULL DEFAULT '[]',
  experience_level TEXT NOT NULL DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'professional')),
  languages        JSONB NOT NULL DEFAULT '["en"]',
  portfolio_url    TEXT,
  github_url       TEXT,
  website_url      TEXT,
  onboarded        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own profile" ON public.profiles FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- CONTESTS
-- ============================================================
CREATE TABLE public.contests (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title               TEXT NOT NULL,
  description         TEXT,
  category            TEXT NOT NULL,
  country             TEXT,
  languages           JSONB NOT NULL DEFAULT '[]',
  prize_amount        NUMERIC,
  currency            TEXT DEFAULT 'JPY',
  deadline            TIMESTAMPTZ,
  entry_fee           NUMERIC DEFAULT 0,
  official_url        TEXT NOT NULL,
  organizer           TEXT,
  estimated_entries   INTEGER,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'upcoming', 'unknown')),
  image_url           TEXT,
  tags                JSONB NOT NULL DEFAULT '[]',
  eligibility         JSONB NOT NULL DEFAULT '{}',
  raw_data            JSONB,
  source              TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contests_category ON public.contests(category);
CREATE INDEX idx_contests_deadline ON public.contests(deadline);
CREATE INDEX idx_contests_status ON public.contests(status);
CREATE INDEX idx_contests_prize ON public.contests(prize_amount DESC);
CREATE INDEX idx_contests_title_trgm ON public.contests USING GIN(title gin_trgm_ops);

-- ============================================================
-- CONTEST ANALYSIS (AI generated)
-- ============================================================
CREATE TABLE public.contest_analysis (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contest_id        UUID NOT NULL UNIQUE REFERENCES public.contests(id) ON DELETE CASCADE,
  difficulty_score  INTEGER CHECK (difficulty_score BETWEEN 0 AND 100),
  competition_score INTEGER CHECK (competition_score BETWEEN 0 AND 100),
  quality_score     INTEGER CHECK (quality_score BETWEEN 0 AND 100),
  ai_summary        TEXT,
  success_patterns  TEXT,
  recommended_for   JSONB NOT NULL DEFAULT '[]',
  tags              JSONB NOT NULL DEFAULT '[]',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.contest_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view analysis" ON public.contest_analysis FOR SELECT USING (true);

-- ============================================================
-- USER MATCHES (personalized recommendations)
-- ============================================================
CREATE TABLE public.user_matches (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contest_id       UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  match_score      INTEGER CHECK (match_score BETWEEN 0 AND 100),
  win_probability  NUMERIC(5,4),
  expected_value   NUMERIC,
  reason           TEXT,
  computed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, contest_id)
);

ALTER TABLE public.user_matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own matches" ON public.user_matches FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX idx_user_matches_user ON public.user_matches(user_id, match_score DESC);

-- ============================================================
-- WATCHLISTS
-- ============================================================
CREATE TABLE public.watchlists (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contest_id  UUID NOT NULL REFERENCES public.contests(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, contest_id)
);

ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own watchlist" ON public.watchlists FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_watchlists_user ON public.watchlists(user_id);

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.subscriptions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id   TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan                 TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  status               TEXT NOT NULL DEFAULT 'active',
  current_period_end   TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  data        JSONB,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, read, created_at DESC);

-- ============================================================
-- CRAWLER LOGS
-- ============================================================
CREATE TABLE public.crawler_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source      TEXT NOT NULL,
  contests_found INTEGER DEFAULT 0,
  contests_added INTEGER DEFAULT 0,
  errors      JSONB,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER contests_updated_at BEFORE UPDATE ON public.contests FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create user record on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);

  INSERT INTO public.subscriptions (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- SEED DATA (sample contests)
-- ============================================================
INSERT INTO public.contests (title, description, category, country, languages, prize_amount, currency, deadline, official_url, organizer, estimated_entries, status, tags) VALUES
(
  '第168回芥川賞・直木賞',
  '日本文学振興会主催の権威ある文学賞。芥川賞は純文学、直木賞はエンターテインメント作品が対象。',
  'novel',
  'JP',
  '["ja"]',
  1000000,
  'JPY',
  NOW() + INTERVAL '60 days',
  'https://www.bunshun.co.jp/shinkoukai/',
  '日本文学振興会',
  500,
  'active',
  '["純文学", "エンタメ", "日本語", "権威"]'
),
(
  'CLIP STUDIO PAINT イラストコンテスト 2024',
  'デジタルイラストの祭典。テーマは「未来」。Clip Studio Paint使用作品が対象。',
  'illustration',
  'JP',
  '["ja", "en"]',
  500000,
  'JPY',
  NOW() + INTERVAL '45 days',
  'https://www.clipstudio.net/',
  'セルシス',
  3000,
  'active',
  '["デジタルイラスト", "CLIP STUDIO", "漫画"]'
),
(
  'GitHub AI Hackathon 2024',
  'Build AI-powered developer tools using GitHub Copilot APIs. Open worldwide.',
  'programming',
  'US',
  '["en"]',
  50000,
  'USD',
  NOW() + INTERVAL '30 days',
  'https://github.com',
  'GitHub',
  2000,
  'active',
  '["AI", "hackathon", "developer-tools", "open-source"]'
),
(
  'AI Art World Championship',
  'Global AI art competition. Create stunning works using any AI art generation tool.',
  'ai',
  NULL,
  '["en", "ja", "zh", "es", "fr", "de"]',
  100000,
  'USD',
  NOW() + INTERVAL '75 days',
  'https://example.com/ai-art',
  'AI Creative Foundation',
  10000,
  'active',
  '["AI art", "generative", "midjourney", "stable-diffusion"]'
),
(
  '富士フイルム フォトコンテスト',
  '風景・人物・スポーツ部門あり。デジタル・フィルム問わず応募可能。',
  'photography',
  'JP',
  '["ja"]',
  300000,
  'JPY',
  NOW() + INTERVAL '90 days',
  'https://fujifilm.jp',
  '富士フイルム',
  5000,
  'active',
  '["写真", "風景", "ポートレート", "スポーツ"]'
);

-- Insert analysis for seeded contests
INSERT INTO public.contest_analysis (contest_id, difficulty_score, competition_score, quality_score, ai_summary, success_patterns, recommended_for)
SELECT
  id,
  CASE category
    WHEN 'novel' THEN 85
    WHEN 'illustration' THEN 60
    WHEN 'programming' THEN 70
    WHEN 'ai' THEN 55
    WHEN 'photography' THEN 50
  END,
  CASE category
    WHEN 'novel' THEN 40
    WHEN 'illustration' THEN 75
    WHEN 'programming' THEN 65
    WHEN 'ai' THEN 80
    WHEN 'photography' THEN 70
  END,
  CASE category
    WHEN 'novel' THEN 90
    WHEN 'illustration' THEN 80
    WHEN 'programming' THEN 85
    WHEN 'ai' THEN 75
    WHEN 'photography' THEN 70
  END,
  'AI分析中です。詳細な分析はPremiumプランでご覧いただけます。',
  '過去の受賞作品のパターン分析中...',
  CASE category
    WHEN 'novel' THEN '["novel", "advanced", "professional"]'::jsonb
    WHEN 'illustration' THEN '["illustration", "intermediate", "advanced"]'::jsonb
    WHEN 'programming' THEN '["programming", "intermediate", "advanced"]'::jsonb
    WHEN 'ai' THEN '["ai", "beginner", "intermediate"]'::jsonb
    WHEN 'photography' THEN '["photography", "intermediate"]'::jsonb
  END
FROM public.contests;

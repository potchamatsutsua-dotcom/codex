export type Plan = "free" | "pro" | "premium";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "professional";
export type ContestStatus = "active" | "closed" | "upcoming" | "unknown";
export type ContestCategory = "novel" | "illustration" | "programming" | "ai" | "photography" | "video" | "design" | "startup" | "research" | "scholarship";

export interface User {
  id: string;
  email: string;
  name: string | null;
  country: string | null;
  language: string;
  plan: Plan;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  bio: string | null;
  skills: string[];
  categories: ContestCategory[];
  experience_level: ExperienceLevel;
  languages: string[];
  portfolio_url: string | null;
  github_url: string | null;
  website_url: string | null;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contest {
  id: string;
  title: string;
  description: string | null;
  category: ContestCategory;
  country: string | null;
  languages: string[];
  prize_amount: number | null;
  currency: string;
  deadline: string | null;
  entry_fee: number;
  official_url: string;
  organizer: string | null;
  estimated_entries: number | null;
  status: ContestStatus;
  image_url: string | null;
  tags: string[];
  eligibility: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ContestAnalysis {
  id: string;
  contest_id: string;
  difficulty_score: number | null;
  competition_score: number | null;
  quality_score: number | null;
  ai_summary: string | null;
  success_patterns: string | null;
  recommended_for: string[];
  tags: string[];
  updated_at: string;
}

export interface UserMatch {
  id: string;
  user_id: string;
  contest_id: string;
  match_score: number | null;
  win_probability: number | null;
  expected_value: number | null;
  reason: string | null;
  computed_at: string;
}

export interface Watchlist {
  id: string;
  user_id: string;
  contest_id: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  plan: Plan;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export interface ContestWithAnalysis extends Contest {
  contest_analysis?: ContestAnalysis | null;
}

export interface ContestWithMatch extends ContestWithAnalysis {
  user_matches?: UserMatch | null;
  watchlists?: { id: string }[];
}

export interface AIAnalysisResult {
  difficulty: number;
  competition: number;
  quality: number;
  recommended_for: string[];
  summary: string;
  success_patterns: string;
  tags: string[];
}

export interface MatchResult {
  contest_id: string;
  match_score: number;
  win_probability: number;
  expected_value: number;
  reason: string;
}

export interface DashboardStats {
  total_active_contests: number;
  total_prize_pool: number;
  watchlist_count: number;
  new_today: number;
  top_matches: ContestWithMatch[];
}

export interface AdminStats {
  total_users: number;
  paying_users: number;
  mrr: number;
  churn_rate: number;
  total_contests: number;
  contests_by_category: Record<string, number>;
  users_by_country: Record<string, number>;
}

export type SortOption = "recommended" | "prize" | "deadline" | "win_probability" | "expected_value";
export type FilterCategory = ContestCategory | "all";

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null, currency = "JPY"): string {
  if (amount === null || amount === undefined) return "非公開";

  const locale = currency === "JPY" ? "ja-JP" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string | null, locale = "ja-JP"): string {
  if (!dateStr) return "締切未定";
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return "締切未定";

  const now = new Date();
  const deadline = new Date(dateStr);
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "締切済";
  if (diffDays === 0) return "本日締切";
  if (diffDays === 1) return "明日締切";
  if (diffDays <= 7) return `あと${diffDays}日`;
  if (diffDays <= 30) return `あと${Math.ceil(diffDays / 7)}週間`;
  return `あと${Math.ceil(diffDays / 30)}ヶ月`;
}

export function formatWinProbability(prob: number | null): string {
  if (prob === null || prob === undefined) return "計算中";
  return `${(prob * 100).toFixed(1)}%`;
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    novel: "小説",
    illustration: "イラスト",
    programming: "プログラミング",
    ai: "AI",
    photography: "写真",
    video: "動画",
    design: "デザイン",
    startup: "スタートアップ",
    research: "研究助成",
    scholarship: "奨学金",
    all: "すべて",
  };
  return labels[category] ?? category;
}

export function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    novel: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    illustration: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    programming: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    ai: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    photography: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    video: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    design: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  };
  return colors[category] ?? "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
}

export function getDifficultyLabel(score: number | null): string {
  if (score === null) return "不明";
  if (score >= 80) return "超難関";
  if (score >= 60) return "難しい";
  if (score >= 40) return "普通";
  if (score >= 20) return "易しい";
  return "入門";
}

export function getDifficultyStars(score: number | null): number {
  if (score === null) return 0;
  return Math.ceil(score / 20);
}

export function getExperienceLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    beginner: "初心者",
    intermediate: "中級者",
    advanced: "上級者",
    professional: "プロ",
  };
  return labels[level] ?? level;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

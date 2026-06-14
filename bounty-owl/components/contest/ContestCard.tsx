"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, ExternalLink, Trophy, Clock, Users, Star } from "lucide-react";
import {
  cn,
  formatCurrency,
  formatRelativeDate,
  formatWinProbability,
  getCategoryColor,
  getCategoryLabel,
  getDifficultyStars,
} from "@/lib/utils";
import type { ContestWithMatch } from "@/types";

interface ContestCardProps {
  contest: ContestWithMatch;
  showMatch?: boolean;
  onWatchlistToggle?: (contestId: string, isWatched: boolean) => Promise<void>;
  className?: string;
}

export function ContestCard({ contest, showMatch = false, onWatchlistToggle, className }: ContestCardProps) {
  const [isWatched, setIsWatched] = useState((contest.watchlists?.length ?? 0) > 0);
  const [saving, setSaving] = useState(false);

  const match = contest.user_matches;
  const analysis = contest.contest_analysis;
  const difficultyStars = getDifficultyStars(analysis?.difficulty_score ?? null);

  const daysLeft = contest.deadline
    ? Math.ceil((new Date(contest.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;
  const deadlineSoon = daysLeft !== null && daysLeft <= 7 && daysLeft >= 0;
  const deadlinePast = daysLeft !== null && daysLeft < 0;

  const handleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!onWatchlistToggle || saving) return;
    setSaving(true);
    try {
      await onWatchlistToggle(contest.id, isWatched);
      setIsWatched(!isWatched);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative bg-card rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 flex flex-col",
        className
      )}
    >
      {/* Top accent bar */}
      <div className={cn("h-1 w-full", getCategoryAccent(contest.category))} />

      {/* Deadline badge */}
      {deadlineSoon && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500 text-white text-[10px] font-bold px-2 py-0.5">
            <Clock className="h-2.5 w-2.5" />
            あと{daysLeft}日
          </span>
        </div>
      )}

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header */}
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <span className={cn("inline-block text-[11px] font-semibold px-2 py-0.5 rounded-md mb-1.5", getCategoryColor(contest.category))}>
              {getCategoryLabel(contest.category)}
            </span>
            <Link href={`/dashboard/contests/${contest.id}`}>
              <h3 className="font-bold text-sm leading-snug line-clamp-2 hover:text-amber-500 transition-colors">
                {contest.title}
              </h3>
            </Link>
            {contest.organizer && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{contest.organizer}</p>
            )}
          </div>

          {onWatchlistToggle && (
            <button
              onClick={handleBookmark}
              disabled={saving}
              className={cn(
                "shrink-0 mt-0.5 p-1.5 rounded-xl transition-all",
                isWatched
                  ? "bg-amber-100 text-amber-500 dark:bg-amber-950"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {isWatched ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Prize + Deadline */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-500" />
            <span className="text-base font-black text-amber-600 dark:text-amber-400">
              {formatCurrency(contest.prize_amount, contest.currency)}
            </span>
          </div>
          <div className={cn(
            "flex items-center gap-1 text-xs",
            deadlineSoon ? "text-red-500 font-semibold" : deadlinePast ? "text-muted-foreground/50 line-through" : "text-muted-foreground"
          )}>
            <Clock className="h-3.5 w-3.5" />
            {formatRelativeDate(contest.deadline)}
          </div>
        </div>

        {/* Difficulty */}
        {analysis && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">難易度</span>
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn("h-3 w-3", i < difficultyStars ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")}
                />
              ))}
            </div>
          </div>
        )}

        {/* Match score bar */}
        {showMatch && match && (
          <div className="rounded-xl bg-muted/60 p-3 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">AIマッチ度</span>
              <span className="font-black text-primary">{match.match_score}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
                style={{ width: `${match.match_score ?? 0}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>勝率 <strong className="text-foreground">{formatWinProbability(match.win_probability)}</strong></span>
              <span>期待値 <strong className="text-amber-600 dark:text-amber-400">{formatCurrency(match.expected_value, contest.currency)}</strong></span>
            </div>
          </div>
        )}

        {/* Participants */}
        {contest.estimated_entries && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Users className="h-3 w-3" />
            推定 {contest.estimated_entries.toLocaleString()}人が応募
          </div>
        )}
      </div>

      {/* Footer buttons */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => window.open(contest.official_url, "_blank", "noopener,noreferrer")}
          className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold hover:from-amber-600 hover:to-orange-600 transition-all shadow-sm shadow-amber-500/20"
        >
          応募する
          <ExternalLink className="h-3 w-3" />
        </button>
        <Link
          href={`/dashboard/contests/${contest.id}`}
          className="h-9 px-3 rounded-xl border text-xs font-medium flex items-center hover:bg-muted transition-colors"
        >
          詳細
        </Link>
      </div>
    </div>
  );
}

function getCategoryAccent(category: string): string {
  const map: Record<string, string> = {
    novel: "bg-amber-400",
    illustration: "bg-pink-400",
    programming: "bg-blue-500",
    ai: "bg-purple-500",
    photography: "bg-green-500",
    video: "bg-red-500",
    design: "bg-orange-400",
    startup: "bg-indigo-500",
    research: "bg-teal-500",
    scholarship: "bg-cyan-500",
  };
  return map[category] ?? "bg-gray-400";
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Bookmark, BookmarkCheck, ExternalLink, Star, Trophy, Users, Clock } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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

export function ContestCard({
  contest,
  showMatch = false,
  onWatchlistToggle,
  className,
}: ContestCardProps) {
  const [isWatched, setIsWatched] = useState(
    (contest.watchlists?.length ?? 0) > 0
  );
  const [isLoading, setIsLoading] = useState(false);

  const match = contest.user_matches;
  const analysis = contest.contest_analysis;
  const difficultyStars = getDifficultyStars(analysis?.difficulty_score ?? null);

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!onWatchlistToggle || isLoading) return;

    setIsLoading(true);
    try {
      await onWatchlistToggle(contest.id, isWatched);
      setIsWatched(!isWatched);
    } finally {
      setIsLoading(false);
    }
  };

  const deadlineSoon =
    contest.deadline &&
    new Date(contest.deadline).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5",
        className
      )}
    >
      {deadlineSoon && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-orange-500" />
      )}

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", getCategoryColor(contest.category))}>
                {getCategoryLabel(contest.category)}
              </span>
              {contest.status === "upcoming" && (
                <Badge variant="secondary" className="text-xs">近日公開</Badge>
              )}
              {deadlineSoon && (
                <Badge variant="destructive" className="text-xs">締切間近</Badge>
              )}
            </div>
            <Link href={`/dashboard/contests/${contest.id}`}>
              <h3 className="font-semibold text-sm leading-tight line-clamp-2 hover:text-primary transition-colors cursor-pointer">
                {contest.title}
              </h3>
            </Link>
            {contest.organizer && (
              <p className="text-xs text-muted-foreground mt-0.5">{contest.organizer}</p>
            )}
          </div>

          {onWatchlistToggle && (
            <button
              onClick={handleWatchlistToggle}
              disabled={isLoading}
              className="shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors"
              aria-label={isWatched ? "ウォッチリストから削除" : "ウォッチリストに追加"}
            >
              {isWatched ? (
                <BookmarkCheck className="h-4 w-4 text-primary" />
              ) : (
                <Bookmark className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 truncate">
              {formatCurrency(contest.prize_amount, contest.currency)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className={cn("text-xs truncate", deadlineSoon ? "text-red-500 font-medium" : "text-muted-foreground")}>
              {formatRelativeDate(contest.deadline)}
            </span>
          </div>
          {contest.estimated_entries && (
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">
                約{contest.estimated_entries.toLocaleString()}件
              </span>
            </div>
          )}
          {analysis && (
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < difficultyStars
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {showMatch && match && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">マッチ度</span>
              <span className="font-semibold text-primary">{match.match_score}%</span>
            </div>
            <Progress value={match.match_score ?? 0} className="h-1.5" />
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                勝率: <span className="font-medium text-foreground">{formatWinProbability(match.win_probability)}</span>
              </span>
              <span className="text-muted-foreground">
                期待値: <span className="font-medium text-amber-600 dark:text-amber-400">
                  {formatCurrency(match.expected_value, contest.currency)}
                </span>
              </span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0 gap-2">
        <Button
          size="sm"
          variant="gradient"
          className="flex-1 h-8 text-xs"
          onClick={() => window.open(contest.official_url, "_blank", "noopener,noreferrer")}
        >
          応募する
          <ExternalLink className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
          <Link href={`/dashboard/contests/${contest.id}`}>詳細</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

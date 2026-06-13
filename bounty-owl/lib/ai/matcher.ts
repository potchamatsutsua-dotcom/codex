"use server";

import { supabaseAdmin } from "@/lib/db/client";
import type { Profile, Contest, ContestAnalysis, MatchResult } from "@/types";

const WEIGHTS = {
  skill_match: 0.4,
  language_match: 0.2,
  country_eligibility: 0.15,
  experience_match: 0.15,
  prize_preference: 0.1,
};

const EXPERIENCE_LEVEL_MAP: Record<string, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  professional: 4,
};

function computeSkillMatch(profile: Profile, contest: Contest, analysis: ContestAnalysis | null): number {
  if (!analysis?.recommended_for?.length) return 50;

  const profileCategories = new Set(profile.categories ?? []);
  const profileExperience = profile.experience_level;

  let score = 0;

  if (profileCategories.has(contest.category as never)) {
    score += 70;
  }

  if (analysis.recommended_for.includes(profileExperience)) {
    score += 30;
  } else if (analysis.recommended_for.includes("all")) {
    score += 20;
  }

  return Math.min(100, score);
}

function computeLanguageMatch(profile: Profile, contest: Contest): number {
  const userLangs = new Set(profile.languages ?? ["en"]);
  const contestLangs = contest.languages ?? [];

  if (contestLangs.length === 0) return 80;

  const overlap = contestLangs.filter((l) => userLangs.has(l)).length;
  return overlap > 0 ? 100 : 0;
}

function computeCountryEligibility(profile: Profile, contest: Contest): number {
  if (!contest.country) return 100;

  const eligibility = contest.eligibility as Record<string, unknown>;
  if (eligibility?.global) return 100;

  return contest.country === (profile as Profile & { user?: { country?: string } }).user?.country ? 100 : 60;
}

function computeExperienceMatch(profile: Profile, analysis: ContestAnalysis | null): number {
  if (!analysis) return 50;

  const difficulty = analysis.difficulty_score ?? 50;
  const userLevel = EXPERIENCE_LEVEL_MAP[profile.experience_level] ?? 2;

  const difficultyLevel = difficulty < 30 ? 1 : difficulty < 55 ? 2 : difficulty < 75 ? 3 : 4;

  const diff = Math.abs(userLevel - difficultyLevel);
  return Math.max(0, 100 - diff * 25);
}

function computePrizePreference(_profile: Profile, contest: Contest): number {
  const prize = contest.prize_amount ?? 0;
  if (prize >= 1000000) return 100;
  if (prize >= 100000) return 80;
  if (prize >= 10000) return 60;
  if (prize > 0) return 40;
  return 20;
}

function estimateWinProbability(
  matchScore: number,
  estimatedEntries: number | null,
  difficultyScore: number | null
): number {
  const entries = estimatedEntries ?? 1000;
  const difficulty = (difficultyScore ?? 50) / 100;

  const baseProb = 1 / entries;
  const skillMultiplier = (matchScore / 100) * (1 - difficulty * 0.5) + difficulty * 0.1;

  return Math.min(0.9, baseProb * skillMultiplier * 100);
}

export async function computeUserMatch(
  profile: Profile,
  contest: Contest,
  analysis: ContestAnalysis | null
): Promise<MatchResult> {
  const skillScore = computeSkillMatch(profile, contest, analysis);
  const langScore = computeLanguageMatch(profile, contest);
  const countryScore = computeCountryEligibility(profile, contest);
  const expScore = computeExperienceMatch(profile, analysis);
  const prizeScore = computePrizePreference(profile, contest);

  const matchScore = Math.round(
    skillScore * WEIGHTS.skill_match +
    langScore * WEIGHTS.language_match +
    countryScore * WEIGHTS.country_eligibility +
    expScore * WEIGHTS.experience_match +
    prizeScore * WEIGHTS.prize_preference
  );

  const winProbability = estimateWinProbability(
    matchScore,
    contest.estimated_entries,
    analysis?.difficulty_score ?? null
  );

  const expectedValue = winProbability * (contest.prize_amount ?? 0);

  const reasons: string[] = [];
  if (skillScore >= 70) reasons.push(`${contest.category}カテゴリに一致`);
  if (langScore === 100) reasons.push("言語条件を満たしている");
  if (expScore >= 70) reasons.push("経験レベルが適切");
  if (prizeScore >= 80) reasons.push("高額賞金案件");

  return {
    contest_id: contest.id,
    match_score: matchScore,
    win_probability: parseFloat(winProbability.toFixed(4)),
    expected_value: parseFloat(expectedValue.toFixed(0)),
    reason: reasons.join("。") || "プロフィールに基づきレコメンド",
  };
}

export async function computeAllMatchesForUser(userId: string): Promise<void> {
  const [profileResult, contestsResult] = await Promise.all([
    supabaseAdmin.from("profiles").select("*").eq("user_id", userId).single(),
    supabaseAdmin
      .from("contests")
      .select("*, contest_analysis(*)")
      .eq("status", "active"),
  ]);

  if (profileResult.error || !profileResult.data) return;
  if (contestsResult.error || !contestsResult.data) return;

  const profile = profileResult.data as Profile;
  const contests = contestsResult.data as (Contest & { contest_analysis: ContestAnalysis[] })[];

  const matches = await Promise.all(
    contests.map(async (contest) => {
      const analysis = contest.contest_analysis?.[0] ?? null;
      const match = await computeUserMatch(profile, contest, analysis);
      return {
        user_id: userId,
        ...match,
        computed_at: new Date().toISOString(),
      };
    })
  );

  await supabaseAdmin
    .from("user_matches")
    .upsert(matches, { onConflict: "user_id,contest_id" });
}

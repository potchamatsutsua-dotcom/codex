import { supabaseAdmin } from "./client";
import type { ContestWithMatch } from "@/types";

export async function getWatchlist(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("watchlists")
    .select(`
      *,
      contests(
        *,
        contest_analysis(*),
        user_matches(match_score, win_probability, expected_value)
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addToWatchlist(userId: string, contestId: string) {
  const { data, error } = await supabaseAdmin
    .from("watchlists")
    .insert({ user_id: userId, contest_id: contestId })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return null;
    throw error;
  }
  return data;
}

export async function removeFromWatchlist(userId: string, contestId: string) {
  const { error } = await supabaseAdmin
    .from("watchlists")
    .delete()
    .eq("user_id", userId)
    .eq("contest_id", contestId);

  if (error) throw error;
}

export async function isInWatchlist(userId: string, contestId: string) {
  const { data } = await supabaseAdmin
    .from("watchlists")
    .select("id")
    .eq("user_id", userId)
    .eq("contest_id", contestId)
    .single();

  return !!data;
}

export async function getWatchlistCount(userId: string) {
  const { count } = await supabaseAdmin
    .from("watchlists")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return count ?? 0;
}

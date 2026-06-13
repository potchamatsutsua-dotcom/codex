import { supabaseAdmin } from "./client";
import type { Contest, ContestWithMatch, FilterCategory, SortOption } from "@/types";

export interface GetContestsOptions {
  category?: FilterCategory;
  sort?: SortOption;
  limit?: number;
  offset?: number;
  userId?: string;
  search?: string;
  country?: string;
  status?: string;
}

export async function getContests(options: GetContestsOptions = {}) {
  const {
    category = "all",
    sort = "deadline",
    limit = 20,
    offset = 0,
    userId,
    search,
    status = "active",
  } = options;

  let query = supabaseAdmin
    .from("contests")
    .select(`
      *,
      contest_analysis(*),
      ${userId ? `user_matches!inner(match_score, win_probability, expected_value, reason),` : ""}
      watchlists(id)
    `)
    .eq("status", status)
    .range(offset, offset + limit - 1);

  if (category !== "all") {
    query = query.eq("category", category);
  }

  if (search) {
    query = query.ilike("title", `%${search}%`);
  }

  if (userId) {
    query = query.eq("user_matches.user_id", userId);
  }

  switch (sort) {
    case "prize":
      query = query.order("prize_amount", { ascending: false });
      break;
    case "deadline":
      query = query.order("deadline", { ascending: true });
      break;
    case "win_probability":
      query = query.order("user_matches.win_probability", { ascending: false });
      break;
    case "expected_value":
      query = query.order("user_matches.expected_value", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return { contests: data as ContestWithMatch[], count };
}

export async function getContestById(id: string, userId?: string) {
  const { data, error } = await supabaseAdmin
    .from("contests")
    .select(`
      *,
      contest_analysis(*),
      ${userId ? "user_matches(match_score, win_probability, expected_value, reason)," : ""}
      watchlists(id)
    `)
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as ContestWithMatch;
}

export async function createContest(contest: Omit<Contest, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabaseAdmin
    .from("contests")
    .insert(contest)
    .select()
    .single();

  if (error) throw error;
  return data as Contest;
}

export async function getContestStats() {
  const { data, error } = await supabaseAdmin
    .from("contests")
    .select("category, prize_amount, status, created_at");

  if (error) throw error;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return {
    total_active: data?.filter((c) => c.status === "active").length ?? 0,
    total_prize_pool: data?.reduce((sum, c) => sum + (c.prize_amount ?? 0), 0) ?? 0,
    new_today: data?.filter((c) => new Date(c.created_at) >= today).length ?? 0,
    by_category: data?.reduce(
      (acc, c) => {
        acc[c.category] = (acc[c.category] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}

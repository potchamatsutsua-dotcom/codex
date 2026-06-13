import { supabaseAdmin } from "./client";
import type { Profile, User, Subscription } from "@/types";

export async function getUserById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as User;
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function updateUserProfile(userId: string, updates: Partial<Profile>) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

export async function updateUser(id: string, updates: Partial<User>) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as User;
}

export async function getSubscription(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data as Subscription;
}

export async function updateSubscription(userId: string, updates: Partial<Subscription>) {
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .update(updates)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as Subscription;
}

export async function upsertSubscription(
  userId: string,
  data: Partial<Subscription> & { user_id: string }
) {
  const { data: result, error } = await supabaseAdmin
    .from("subscriptions")
    .upsert(data, { onConflict: "user_id" })
    .select()
    .single();

  if (error) throw error;
  return result as Subscription;
}

export async function getAdminStats() {
  const [usersResult, subscriptionsResult] = await Promise.all([
    supabaseAdmin.from("users").select("country, created_at"),
    supabaseAdmin.from("subscriptions").select("plan, status"),
  ]);

  const users = usersResult.data ?? [];
  const subscriptions = subscriptionsResult.data ?? [];

  const payingUsers = subscriptions.filter(
    (s) => s.plan !== "free" && s.status === "active"
  ).length;

  const proCount = subscriptions.filter((s) => s.plan === "pro").length;
  const premiumCount = subscriptions.filter((s) => s.plan === "premium").length;
  const mrr = proCount * 980 + premiumCount * 1980;

  const usersByCountry = users.reduce(
    (acc, u) => {
      const c = u.country ?? "unknown";
      acc[c] = (acc[c] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    total_users: users.length,
    paying_users: payingUsers,
    mrr,
    churn_rate: 0,
    users_by_country: usersByCountry,
  };
}

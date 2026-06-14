import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/auth/server";
import { computeAllMatchesForUser } from "@/lib/ai/matcher";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await computeAllMatchesForUser(user.id);
  return NextResponse.json({ success: true });
}

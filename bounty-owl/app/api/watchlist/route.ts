import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/auth/server";
import {
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from "@/lib/db/watchlist";
import { getUserById } from "@/lib/db/users";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await getUserById(user.id);
  const limit = dbUser.plan === "free" ? 10 : undefined;

  const items = await getWatchlist(user.id);
  const contests = items.slice(0, limit).map((item) => ({
    ...(item.contests as Record<string, unknown>),
    watchlists: [{ id: item.id }],
  }));

  return NextResponse.json({ contests });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const dbUser = await getUserById(user.id);
  if (dbUser.plan === "free") {
    const { supabaseAdmin } = await import("@/lib/db/client");
    const { count } = await supabaseAdmin
      .from("watchlists")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if ((count ?? 0) >= 10) {
      return NextResponse.json(
        { error: "Free plan limit reached. Upgrade to Pro for unlimited watchlist." },
        { status: 403 }
      );
    }
  }

  const body = await request.json() as { contestId: string };
  const result = await addToWatchlist(user.id, body.contestId);
  return NextResponse.json({ success: true, data: result });
}

export async function DELETE(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { contestId: string };
  await removeFromWatchlist(user.id, body.contestId);
  return NextResponse.json({ success: true });
}

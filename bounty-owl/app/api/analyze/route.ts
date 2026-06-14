import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/auth/server";
import { getSubscription } from "@/lib/db/users";
import { getContestById } from "@/lib/db/contests";
import { getUserProfile } from "@/lib/db/users";
import { generateStrategyReport } from "@/lib/ai/analyzer";
import { supabaseAdmin } from "@/lib/db/client";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await getSubscription(user.id);
  if (subscription.plan !== "premium") {
    return NextResponse.json(
      { error: "Premium plan required for strategy reports" },
      { status: 403 }
    );
  }

  const body = await request.json() as { contestId: string };
  const [contest, profile] = await Promise.all([
    getContestById(body.contestId),
    getUserProfile(user.id),
  ]);

  const report = await generateStrategyReport(contest, {
    skills: profile.skills ?? [],
    experience_level: profile.experience_level,
    categories: profile.categories as string[],
  });

  await supabaseAdmin.from("notifications").insert({
    user_id: user.id,
    type: "strategy_report",
    title: `攻略レポート生成完了: ${contest.title}`,
    body: "AI攻略レポートが生成されました",
    data: { contest_id: body.contestId },
  });

  return NextResponse.json({ report });
}

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/auth/server";
import { createCheckoutSession } from "@/lib/stripe";
import { getSubscription } from "@/lib/db/users";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { plan: "pro" | "premium" };
  if (!["pro", "premium"].includes(body.plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const subscription = await getSubscription(user.id).catch(() => null);

  const url = await createCheckoutSession(
    user.id,
    body.plan,
    user.email!,
    subscription?.stripe_customer_id ?? undefined
  );

  return NextResponse.json({ url });
}

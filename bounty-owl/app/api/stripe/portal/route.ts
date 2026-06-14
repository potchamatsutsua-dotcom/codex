import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/auth/server";
import { createPortalSession } from "@/lib/stripe";
import { getSubscription } from "@/lib/db/users";

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await getSubscription(user.id);
  if (!subscription?.stripe_customer_id) {
    return NextResponse.json({ error: "No subscription found" }, { status: 404 });
  }

  const url = await createPortalSession(subscription.stripe_customer_id);
  return NextResponse.json({ url });
}

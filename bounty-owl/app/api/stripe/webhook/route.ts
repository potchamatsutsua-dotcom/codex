import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { upsertSubscription, updateUser } from "@/lib/db/users";
import { supabaseAdmin } from "@/lib/db/client";
import type { Plan } from "@/types";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const plan = session.metadata?.plan as Plan;

        if (!userId || !plan) break;

        await upsertSubscription(userId, {
          user_id: userId,
          stripe_customer_id: String(session.customer),
          stripe_subscription_id: String(session.subscription),
          plan,
          status: "active",
        });

        await updateUser(userId, { plan });
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (!userId) break;

        const isActive =
          subscription.status === "active" || subscription.status === "trialing";
        const plan = isActive ? (subscription.metadata?.plan as Plan) ?? "free" : "free";

        await upsertSubscription(userId, {
          user_id: userId,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: String(subscription.customer),
          plan,
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
        });

        await updateUser(userId, { plan });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = String(invoice.customer);

        const { data } = await supabaseAdmin
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (data?.user_id) {
          await supabaseAdmin.from("notifications").insert({
            user_id: data.user_id,
            type: "payment_failed",
            title: "お支払いに失敗しました",
            body: "支払い情報を更新してください",
            data: { invoice_id: invoice.id },
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}

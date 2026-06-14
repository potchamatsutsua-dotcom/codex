import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
  typescript: true,
});

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    priceId: null,
    features: ["1日5件閲覧", "保存10件"],
    limits: { daily_views: 5, watchlist: 10 },
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 980,
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    features: ["無制限閲覧", "AI分析", "通知", "無制限保存"],
    limits: { daily_views: -1, watchlist: -1 },
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 1980,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    features: ["AI攻略レポート", "優先通知", "勝率予測", "全Pro機能"],
    limits: { daily_views: -1, watchlist: -1 },
  },
} as const;

export async function createCheckoutSession(
  userId: string,
  planId: "pro" | "premium",
  customerEmail: string,
  existingCustomerId?: string
): Promise<string> {
  const plan = PLANS[planId];
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: "subscription",
    line_items: [{ price: plan.priceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/pricing?checkout=cancelled`,
    metadata: { user_id: userId, plan: planId },
    subscription_data: { metadata: { user_id: userId, plan: planId } },
  };

  if (existingCustomerId) {
    sessionParams.customer = existingCustomerId;
  } else {
    sessionParams.customer_email = customerEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionParams);
  return session.url!;
}

export async function createPortalSession(
  customerId: string
): Promise<string> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/dashboard`,
  });

  return session.url;
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

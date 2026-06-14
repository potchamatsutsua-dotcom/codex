import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/auth/server";
import { getUserById, getUserProfile, getSubscription, updateUser, updateUserProfile } from "@/lib/db/users";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [dbUser, profile, subscription] = await Promise.all([
    getUserById(user.id),
    getUserProfile(user.id).catch(() => null),
    getSubscription(user.id).catch(() => null),
  ]);

  return NextResponse.json({ user: dbUser, profile, subscription });
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as {
    name?: string;
    bio?: string;
    portfolio_url?: string;
    github_url?: string;
    website_url?: string;
    categories?: string[];
    languages?: string[];
    experience_level?: string;
    skills?: string[];
  };

  const { name, bio, portfolio_url, github_url, website_url, categories, languages, experience_level, skills } = body;

  const [updatedUser, updatedProfile] = await Promise.all([
    name !== undefined ? updateUser(user.id, { name }) : Promise.resolve(null),
    updateUserProfile(user.id, {
      bio,
      portfolio_url,
      github_url,
      website_url,
      categories: categories as never,
      languages,
      experience_level: experience_level as never,
      skills,
    }),
  ]);

  return NextResponse.json({ success: true, user: updatedUser, profile: updatedProfile });
}

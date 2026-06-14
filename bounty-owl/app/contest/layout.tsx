import { Navbar } from "@/components/layout/Navbar";
import { getUser } from "@/lib/auth/server";
import { getUserById } from "@/lib/db/users";

export default async function ContestLayout({ children }: { children: React.ReactNode }) {
  const authUser = await getUser();
  let user = null;
  if (authUser) {
    try { user = await getUserById(authUser.id); } catch {}
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1">{children}</main>
      <footer className="border-t py-8 px-4 text-center text-sm text-muted-foreground">
        © 2024 Bounty Owl — <a href="/" className="hover:text-foreground">ホーム</a>
      </footer>
    </div>
  );
}

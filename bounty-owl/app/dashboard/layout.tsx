import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { requireAuth } from "@/lib/auth/server";
import { getUserById } from "@/lib/db/users";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authUser = await requireAuth();

  let user = null;
  try {
    user = await getUserById(authUser.id);
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl">
        {children}
      </main>
    </div>
  );
}

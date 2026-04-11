import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TopBar } from "@/components/ui/TopBar";
import { Sidebar } from "@/components/ui/Sidebar";
import type { Role } from "@/generated/prisma/client";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userName = session.user.name ?? "";
  const role = session.user.role as Role;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white">
      <TopBar userName={userName} role={role} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={role} />
        <main className="flex-1 min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

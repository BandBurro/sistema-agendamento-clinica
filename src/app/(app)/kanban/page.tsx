import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import type { DentistWithUser } from "@/types";

export default async function KanbanPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "RECEPTIONIST"].includes(session.user.role as string)) {
    redirect("/dashboard");
  }

  const dentists = await prisma.dentist.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: "asc" } },
  });

  return (
    <KanbanBoard dentists={dentists as unknown as DentistWithUser[]} />
  );
}

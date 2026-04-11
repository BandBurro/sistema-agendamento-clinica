import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DayView } from "./DayView";
import { Suspense } from "react";
import type { Role } from "@/generated/prisma/client";
import type { DentistWithUser } from "@/types";

export default async function DayPage() {
  const session = await auth();
  const role = session!.user.role as Role;

  let dentists;
  if (role === "DENTIST") {
    dentists = await prisma.dentist.findMany({
      where: { userId: session!.user.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  } else {
    dentists = await prisma.dentist.findMany({
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { user: { name: "asc" } },
    });
  }

  return (
    <Suspense fallback={<div className="text-gray-400 text-sm">Carregando...</div>}>
      <DayView dentists={dentists as unknown as DentistWithUser[]} role={role} />
    </Suspense>
  );
}

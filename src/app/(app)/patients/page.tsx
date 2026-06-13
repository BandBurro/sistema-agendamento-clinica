import { requireAuth } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { PatientsClient } from "./PatientsClient";

export default async function PatientsPage() {
  const { error } = await requireAuth(["ADMIN", "RECEPTIONIST", "DENTIST"]);
  if (error) return error;

  const patients = await prisma.patient.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, active: true } },
      appointments: {
        orderBy: { date: "desc" },
        take: 1,
        select: { status: true, date: true },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return <PatientsClient patients={patients} />;
}

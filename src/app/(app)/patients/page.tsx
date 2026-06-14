import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PatientsClient } from "./PatientsClient";

export default async function PatientsPage() {
  const session = await auth();
  if (!session?.user || !["ADMIN", "RECEPTIONIST", "DENTIST"].includes(session.user.role as string)) {
    redirect("/dashboard");
  }

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
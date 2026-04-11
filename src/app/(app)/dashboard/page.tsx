import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  const role = session!.user.role;
  const userId = session!.user.id;

  let dentists: { id: string; user: { name: string } }[] = [];
  if (role === "ADMIN" || role === "RECEPTIONIST") {
    dentists = await prisma.dentist.findMany({
      include: { user: { select: { name: true } } },
      orderBy: { user: { name: "asc" } },
    });
  }

  // Build per-role where clause for stats
  const statsWhere: Record<string, unknown> = {};
  if (role === "DENTIST") {
    const dentist = await prisma.dentist.findUnique({ where: { userId } });
    if (dentist) statsWhere.dentistId = dentist.id;
  } else if (role === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (patient) statsWhere.patientId = patient.id;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const [apptToday, apptWeek, apptPending, totalPatients] = await Promise.all([
    prisma.appointment.count({
      where: { ...statsWhere, date: { gte: todayStart, lt: todayEnd } },
    }),
    prisma.appointment.count({
      where: { ...statsWhere, date: { gte: todayStart, lt: weekEnd } },
    }),
    prisma.appointment.count({
      where: { ...statsWhere, status: "REQUESTED" },
    }),
    role === "PATIENT" ? Promise.resolve(null) : prisma.patient.count(),
  ]);

  return (
    <DashboardClient
      role={role}
      dentists={dentists}
      stats={{ apptToday, apptWeek, apptPending, totalPatients }}
    />
  );
}

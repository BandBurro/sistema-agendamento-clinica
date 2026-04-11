import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

const APPOINTMENT_INCLUDE = {
  patient: { include: { user: { select: { id: true, name: true, email: true } } } },
  dentist: { include: { user: { select: { id: true, name: true, email: true } } } },
};

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const dentistId = searchParams.get("dentistId");
  const date = searchParams.get("date"); // YYYY-MM-DD
  const month = searchParams.get("month"); // YYYY-MM
  const from = searchParams.get("from"); // YYYY-MM-DD
  const to = searchParams.get("to"); // YYYY-MM-DD
  const status = searchParams.get("status");

  const role = session!.user.role;
  const userId = session!.user.id;

  // Build where clause based on role
  const where: Record<string, unknown> = {};

  if (role === "DENTIST") {
    const dentist = await prisma.dentist.findUnique({ where: { userId } });
    if (!dentist) return NextResponse.json([], { status: 200 });
    where.dentistId = dentist.id;
  } else if (role === "PATIENT") {
    const patient = await prisma.patient.findUnique({ where: { userId } });
    if (!patient) return NextResponse.json([], { status: 200 });
    where.patientId = patient.id;
  } else if (dentistId) {
    where.dentistId = dentistId;
  }

  if (status) where.status = status;

  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.date = { gte: start, lt: end };
  } else if (from || to) {
    where.date = {
      ...(from && { gte: new Date(from) }),
      ...(to && { lte: new Date(to) }),
    };
  } else if (month) {
    const [year, monthNum] = month.split("-").map(Number);
    const start = new Date(year, monthNum - 1, 1);
    const end = new Date(year, monthNum, 1);
    where.date = { gte: start, lt: end };
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: APPOINTMENT_INCLUDE,
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth(["ADMIN", "RECEPTIONIST", "PATIENT"]);
  if (error) return error;

  try {
    const body = await req.json();
    const { patientId, dentistId, date, startTime, endTime, notes } = body;

    if (!patientId || !dentistId || !date || !startTime || !endTime) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    // Patients can only create appointments for themselves
    if (session!.user.role === "PATIENT") {
      const patient = await prisma.patient.findUnique({
        where: { userId: session!.user.id },
      });
      if (!patient || patient.id !== patientId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        dentistId,
        date: new Date(date),
        startTime: new Date(`1970-01-01T${startTime}:00`),
        endTime: new Date(`1970-01-01T${endTime}:00`),
        notes,
        status: "REQUESTED",
      },
      include: APPOINTMENT_INCLUDE,
    });

    return NextResponse.json(appointment, { status: 201 });
  } catch (err) {
    console.error("[appointments POST]", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

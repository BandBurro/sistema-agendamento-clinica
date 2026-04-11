import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  const { error } = await requireAuth(["ADMIN", "RECEPTIONIST", "DENTIST"]);
  if (error) return error;

  const patients = await prisma.patient.findMany({
    include: { user: { select: { id: true, name: true, email: true, active: true } } },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const { error } = await requireAuth(["ADMIN", "RECEPTIONIST"]);
  if (error) return error;

  try {
    const body = await req.json();
    const { name, email, password, phone, dateOfBirth, medicalNotes } = body;

    if (!name || !email || !password || !phone || !dateOfBirth) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email já em uso." }, { status: 409 });
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "PATIENT",
        patient: {
          create: { phone, dateOfBirth: new Date(dateOfBirth), medicalNotes },
        },
      },
      include: { patient: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("[patients POST]", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

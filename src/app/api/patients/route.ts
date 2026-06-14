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
    const {
      name,
      email,
      password,
      phone,
      dateOfBirth,
      medicalNotes,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
    } = body;

    if (!name || !email || !password || !phone || !dateOfBirth) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes." }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email já em uso." }, { status: 409 });
    }

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 12);

    const blankToNull = (v: unknown) =>
      typeof v === "string" && v.trim() ? v.trim() : null;
    const cepDigits = typeof cep === "string" ? cep.replace(/\D/g, "") : "";
    const phoneDigits = typeof phone === "string" ? phone.replace(/\D/g, "") : "";
    const normalizedPhone = phoneDigits.startsWith("55") ? phoneDigits : "55" + phoneDigits;
    const ufClean =
      typeof uf === "string" && uf.trim() ? uf.trim().toUpperCase() : null;

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "PATIENT",
        patient: {
          create: {
            phone: normalizedPhone,
            dateOfBirth: new Date(dateOfBirth),
            medicalNotes: blankToNull(medicalNotes),
            cep: cepDigits.length === 8 ? cepDigits : null,
            logradouro: blankToNull(logradouro),
            numero: blankToNull(numero),
            complemento: blankToNull(complemento),
            bairro: blankToNull(bairro),
            cidade: blankToNull(cidade),
            uf: ufClean && /^[A-Z]{2}$/.test(ufClean) ? ufClean : null,
          },
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

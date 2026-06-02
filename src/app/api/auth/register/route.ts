import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { registerSchema } from "@/lib/validations/auth";
import { sendVerificationEmail } from "@/services/email";

export async function POST(req: NextRequest) {
  try {
    // Rate-limit registrations per IP (5 per 15 minutes)
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const rl = checkRateLimit(`register:${ip}`, 5, 15 * 60 * 1000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: `Muitas tentativas de cadastro. Tente novamente em ${rl.retryAfterSeconds} segundos.`,
        },
        { status: 429 },
      );
    }

    // Validate with Zod (confirmPassword is stripped before DB write)
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      // Return the first validation message found
      const first = Object.values(fields).flat()[0];
      return NextResponse.json(
        { error: first ?? "Dados inválidos.", fields },
        { status: 400 },
      );
    }

    const {
      name,
      email,
      password,
      phone,
      dateOfBirth,
      cep,
      logradouro,
      numero,
      complemento,
      bairro,
      cidade,
      uf,
    } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Este email já está em uso." },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate a 64-char hex verification token, expires in 24 hours
    const verifyToken = randomBytes(32).toString("hex");
    const verifyTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const cepDigits = cep ? cep.replace(/\D/g, "") : "";
    const blankToNull = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "PATIENT",
        active: false,        // activated after email verification
        emailVerified: false,
        verifyToken,
        verifyTokenExp,
        patient: {
          create: {
            phone,
            dateOfBirth: new Date(dateOfBirth),
            cep: cepDigits.length === 8 ? cepDigits : null,
            logradouro: blankToNull(logradouro),
            numero: blankToNull(numero),
            complemento: blankToNull(complemento),
            bairro: blankToNull(bairro),
            cidade: blankToNull(cidade),
            uf: uf && uf.trim() ? uf.trim().toUpperCase() : null,
          },
        },
      },
    });

    // Send (mock) verification email
    const { devLink } = await sendVerificationEmail(email, name, verifyToken);

    return NextResponse.json(
      {
        message: "Conta criada. Verifique seu email para ativar o acesso.",
        ...(devLink ? { devVerifyLink: devLink } : {}),
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

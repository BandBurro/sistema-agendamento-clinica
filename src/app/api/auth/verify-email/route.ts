import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token não informado." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { verifyToken: token } });

  if (!user) {
    return NextResponse.json(
      { error: "Token inválido ou já utilizado." },
      { status: 400 },
    );
  }

  if (user.verifyTokenExp && user.verifyTokenExp < new Date()) {
    return NextResponse.json(
      { error: "Este link expirou. Solicite um novo email de verificação." },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      active: true,
      verifyToken: null,
      verifyTokenExp: null,
    },
  });

  return NextResponse.json({ success: true });
}

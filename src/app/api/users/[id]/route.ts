import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["ADMIN"]);
  if (error) return error;

  const { id } = await params;

  try {
    const body = await req.json();
    const { name, role, active } = body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(role && { role }),
        ...(active !== undefined && { active }),
      },
      select: { id: true, name: true, email: true, role: true, active: true },
    });

    return NextResponse.json(user);
  } catch (err) {
    console.error("[users PATCH]", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

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
    const { specialty, workingHours } = body;

    const dentist = await prisma.dentist.update({
      where: { id },
      data: {
        ...(specialty !== undefined && { specialty }),
        ...(workingHours !== undefined && { workingHours }),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(dentist);
  } catch (err) {
    console.error("[dentists PATCH]", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const dentists = await prisma.dentist.findMany({
    include: { user: { select: { id: true, name: true, email: true, active: true } } },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json(dentists);
}

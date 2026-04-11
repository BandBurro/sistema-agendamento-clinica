import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-helpers";
import {
  sendAppointmentConfirmation,
  sendStatusUpdate,
} from "@/services/notification";
import { VALID_TRANSITIONS } from "@/types";
import type { AppointmentStatus } from "@/generated/prisma/client";

const APPOINTMENT_INCLUDE = {
  patient: { include: { user: { select: { id: true, name: true, email: true } } } },
  dentist: { include: { user: { select: { id: true, name: true, email: true } } } },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth();
  if (error) return error;

  const { id } = await params;
  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: APPOINTMENT_INCLUDE,
  });

  if (!appointment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(appointment);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { id } = await params;

  try {
    const body = await req.json();
    const { status, notes, date, startTime, endTime } = body;

    const existing = await prisma.appointment.findUnique({
      where: { id },
      include: APPOINTMENT_INCLUDE,
    });

    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const role = session!.user.role;

    // Validate status transition
    if (status && status !== existing.status) {
      const allowed = VALID_TRANSITIONS[existing.status as AppointmentStatus];
      if (!allowed.includes(status as AppointmentStatus)) {
        return NextResponse.json(
          { error: `Transição inválida: ${existing.status} → ${status}` },
          { status: 422 }
        );
      }

      // Dentists can only move to IN_PROGRESS / COMPLETED
      if (role === "DENTIST" && !["IN_PROGRESS", "COMPLETED"].includes(status)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(date && { date: new Date(date) }),
        ...(startTime && { startTime: new Date(`1970-01-01T${startTime}:00`) }),
        ...(endTime && { endTime: new Date(`1970-01-01T${endTime}:00`) }),
      },
      include: APPOINTMENT_INCLUDE,
    });

    // Fire-and-forget notifications
    if (status && status !== existing.status) {
      const appt = updated as Parameters<typeof sendStatusUpdate>[0];
      if (status === "SCHEDULED") {
        sendAppointmentConfirmation(appt).catch(console.error);
      } else {
        sendStatusUpdate(appt, status as AppointmentStatus).catch(console.error);
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[appointments PATCH]", err);
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(["ADMIN", "RECEPTIONIST"]);
  if (error) return error;

  const { id } = await params;
  await prisma.appointment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

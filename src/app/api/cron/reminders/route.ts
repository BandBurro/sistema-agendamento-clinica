import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendReminder } from "@/services/notification";
import type { AppointmentWithRelations } from "@/types";

const APPOINTMENT_INCLUDE = {
  patient: { include: { user: { select: { id: true, name: true, email: true } } } },
  dentist: { include: { user: { select: { id: true, name: true, email: true } } } },
};

/**
 * GET /api/cron/reminders
 *
 * Finds all SCHEDULED appointments for tomorrow and sends WhatsApp reminders.
 * Invoked daily by Vercel Cron (see vercel.json). Vercel automatically attaches
 * Authorization: Bearer <CRON_SECRET> — the same secret must be set as an env var.
 *
 * Can also be triggered manually:
 *   curl -H "Authorization: Bearer <CRON_SECRET>" https://<host>/api/cron/reminders
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;

  // Only enforce auth when CRON_SECRET is configured (skipped in local dev if unset)
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const tomorrowStart = new Date(Date.UTC(
    tomorrow.getUTCFullYear(),
    tomorrow.getUTCMonth(),
    tomorrow.getUTCDate(),
    0, 0, 0, 0,
  ));
  const tomorrowEnd = new Date(Date.UTC(
    tomorrow.getUTCFullYear(),
    tomorrow.getUTCMonth(),
    tomorrow.getUTCDate(),
    23, 59, 59, 999,
  ));

  const appointments = await prisma.appointment.findMany({
    where: {
      status: "SCHEDULED",
      date: { gte: tomorrowStart, lte: tomorrowEnd },
    },
    include: APPOINTMENT_INCLUDE,
  });

  const results = await Promise.allSettled(
    appointments.map((appt) => sendReminder(appt as unknown as AppointmentWithRelations)),
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  console.log(`[cron/reminders] ${sent} sent, ${failed} failed, ${appointments.length} total`);

  return NextResponse.json({
    ok: true,
    date: tomorrowStart.toISOString().slice(0, 10),
    total: appointments.length,
    sent,
    failed,
  });
}

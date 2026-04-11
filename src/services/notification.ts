import type { AppointmentWithRelations } from "@/types";
import { STATUS_LABELS } from "@/types";
import type { AppointmentStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

async function sendWhatsApp(phone: string, message: string): Promise<void> {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.warn("[Notification] Evolution API not configured, skipping WhatsApp message.");
    return;
  }

  const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/clinica`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: EVOLUTION_API_KEY,
    },
    body: JSON.stringify({
      number: phone,
      text: message,
    }),
  });

  if (!response.ok) {
    throw new Error(`Evolution API error: ${response.status} ${await response.text()}`);
  }
}

async function logNotification(
  appointmentId: string,
  message: string,
  success: boolean
): Promise<void> {
  await prisma.notification.create({
    data: {
      appointmentId,
      message,
      status: success ? "SENT" : "FAILED",
    },
  });
}

function formatAppointmentDate(appointment: AppointmentWithRelations): string {
  return format(new Date(appointment.date), "EEEE, d 'de' MMMM", { locale: ptBR });
}

function formatTime(time: Date): string {
  return format(new Date(time), "HH:mm");
}

export async function sendAppointmentConfirmation(
  appointment: AppointmentWithRelations
): Promise<void> {
  const { patient, dentist } = appointment;
  const dateStr = formatAppointmentDate(appointment);
  const timeStr = formatTime(appointment.startTime);

  const message =
    `✅ *Consulta Confirmada!*\n\n` +
    `Olá, ${patient.user.name}! Sua consulta foi agendada.\n\n` +
    `📅 *Data:* ${dateStr}\n` +
    `🕐 *Horário:* ${timeStr}\n` +
    `👨‍⚕️ *Dentista:* ${dentist.user.name}\n` +
    `🦷 *Especialidade:* ${dentist.specialty}\n\n` +
    `_Caso precise remarcar, entre em contato conosco._`;

  let success = false;
  try {
    await sendWhatsApp(patient.phone, message);
    success = true;
    console.log(`[Notification] Confirmation sent to ${patient.phone}`);
  } catch (err) {
    console.error("[Notification] Failed to send confirmation:", err);
  } finally {
    await logNotification(appointment.id, message, success);
  }
}

export async function sendStatusUpdate(
  appointment: AppointmentWithRelations,
  newStatus: AppointmentStatus
): Promise<void> {
  const { patient } = appointment;
  const statusLabel = STATUS_LABELS[newStatus];

  const message =
    `📋 *Atualização do Agendamento*\n\n` +
    `Olá, ${patient.user.name}!\n` +
    `O status do seu agendamento foi atualizado para: *${statusLabel}*.\n\n` +
    `_Clínica Dental_`;

  let success = false;
  try {
    await sendWhatsApp(patient.phone, message);
    success = true;
    console.log(`[Notification] Status update sent to ${patient.phone}: ${newStatus}`);
  } catch (err) {
    console.error("[Notification] Failed to send status update:", err);
  } finally {
    await logNotification(appointment.id, message, success);
  }
}

export async function sendReminder(appointment: AppointmentWithRelations): Promise<void> {
  const { patient, dentist } = appointment;
  const timeStr = formatTime(appointment.startTime);

  const message =
    `⏰ *Lembrete de Consulta*\n\n` +
    `Olá, ${patient.user.name}! Sua consulta é amanhã.\n\n` +
    `🕐 *Horário:* ${timeStr}\n` +
    `👨‍⚕️ *Dentista:* ${dentist.user.name}\n\n` +
    `_Não se esqueça! Clínica Dental_`;

  let success = false;
  try {
    await sendWhatsApp(patient.phone, message);
    success = true;
    console.log(`[Notification] Reminder sent to ${patient.phone}`);
  } catch (err) {
    console.error("[Notification] Failed to send reminder:", err);
  } finally {
    await logNotification(appointment.id, message, success);
  }
}

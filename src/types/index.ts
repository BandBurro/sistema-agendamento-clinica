import type { Role, AppointmentStatus } from "@/generated/prisma/client";

export type { Role, AppointmentStatus };

export interface WorkingHour {
  day: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

export interface AppointmentWithRelations {
  id: string;
  patientId: string;
  dentistId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  patient: {
    id: string;
    phone: string;
    user: { id: string; name: string; email: string };
  };
  dentist: {
    id: string;
    specialty: string;
    user: { id: string; name: string; email: string };
  };
}

export interface DentistWithUser {
  id: string;
  specialty: string;
  workingHours: WorkingHour[];
  user: { id: string; name: string; email: string };
}

export interface PatientWithUser {
  id: string;
  phone: string;
  dateOfBirth: Date;
  medicalNotes: string | null;
  user: { id: string; name: string; email: string };
}

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-800 border-yellow-300",
  SCHEDULED: "bg-blue-100 text-blue-800 border-blue-300",
  IN_PROGRESS: "bg-purple-100 text-purple-800 border-purple-300",
  COMPLETED: "bg-green-100 text-green-800 border-green-300",
  CANCELLED: "bg-red-100 text-red-800 border-red-300",
};

export const STATUS_BG_SOLID: Record<AppointmentStatus, string> = {
  REQUESTED: "bg-yellow-400",
  SCHEDULED: "bg-blue-500",
  IN_PROGRESS: "bg-purple-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-400",
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  REQUESTED: "Solicitado",
  SCHEDULED: "Agendado",
  IN_PROGRESS: "Em Atendimento",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

export const VALID_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  REQUESTED: ["SCHEDULED", "COMPLETED", "CANCELLED"],
  SCHEDULED: ["REQUESTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
  IN_PROGRESS: ["SCHEDULED", "COMPLETED", "CANCELLED"],
  COMPLETED: ["IN_PROGRESS"],
  CANCELLED: ["REQUESTED"],
};

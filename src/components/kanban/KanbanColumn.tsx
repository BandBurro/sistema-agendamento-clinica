"use client";

import { useDroppable } from "@dnd-kit/core";
import type { AppointmentStatus } from "@/generated/prisma/client";
import type { AppointmentWithRelations } from "@/types";

interface Props {
  status: AppointmentStatus;
  label: string;
  appointments: AppointmentWithRelations[];
  onCardClick: (appt: AppointmentWithRelations) => void;
  children: React.ReactNode;
}

const STATUS_TOP: Record<AppointmentStatus, string> = {
  REQUESTED: "bg-yellow-400",
  SCHEDULED: "bg-blue-400",
  IN_PROGRESS: "bg-purple-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-300",
};

const STATUS_COUNT_BG: Record<AppointmentStatus, string> = {
  REQUESTED: "bg-yellow-100 text-yellow-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-purple-100 text-purple-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
};

export function KanbanColumn({ status, label, appointments, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col w-64 shrink-0 rounded-2xl border transition-all ${
        isOver
          ? "border-indigo-200 bg-indigo-50 shadow-sm"
          : "border-gray-200 bg-white shadow-sm"
      }`}
    >
      {/* Status top stripe */}
      <div className={`h-1 rounded-t-2xl ${STATUS_TOP[status]}`} />

      {/* Column header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COUNT_BG[status]}`}>
          {appointments.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 p-3 min-h-[120px]">{children}</div>
    </div>
  );
}

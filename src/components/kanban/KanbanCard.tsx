"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AppointmentWithRelations } from "@/types";
import { utcDateToLocal } from "@/lib/time";
import type { AppointmentStatus } from "@/generated/prisma/client";

interface Props {
  appointment: AppointmentWithRelations;
  onClick: () => void;
  isDragging?: boolean;
  isPast?: boolean;
}

const STATUS_BORDER: Record<AppointmentStatus, string> = {
  REQUESTED:   "border-l-yellow-400",
  SCHEDULED:   "border-l-blue-400",
  IN_PROGRESS: "border-l-purple-500",
  COMPLETED:   "border-l-green-500",
  CANCELLED:   "border-l-red-300",
};

export function KanbanCard({ appointment, onClick, isDragging = false, isPast = false }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } =
    useSortable({ id: appointment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.25 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white rounded-xl border border-gray-200 border-l-[3px] ${STATUS_BORDER[appointment.status]} p-3.5 cursor-grab active:cursor-grabbing select-none transition-all duration-150 ${
        isDragging
          ? "shadow-2xl rotate-2 scale-105 border-gray-300"
          : "shadow-sm hover:shadow-lg hover:scale-[1.02] hover:border-gray-300 active:scale-[0.99] active:shadow-md"
      } ${isPast ? "opacity-50 grayscale" : ""}`}
      onClick={(e) => {
        if (!isSortableDragging) {
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
        {appointment.patient.user.name}
      </p>
      <p className="text-xs text-gray-400 mt-0.5 truncate">{appointment.dentist.user.name}</p>

      <div className="flex items-center gap-1.5 mt-2.5">
        <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs text-gray-400">
          {format(utcDateToLocal(appointment.date), "d MMM", { locale: ptBR })}
        </span>
        <span className="text-gray-200">·</span>
        <svg className="w-3 h-3 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs text-gray-400">
          {format(new Date(appointment.startTime), "HH:mm")}
        </span>
      </div>

      {appointment.notes && (
        <p className="text-xs text-gray-400 mt-1.5 truncate italic">{appointment.notes}</p>
      )}
    </div>
  );
}

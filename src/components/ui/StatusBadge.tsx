import { STATUS_COLORS, STATUS_LABELS } from "@/types";
import type { AppointmentStatus } from "@/generated/prisma/client";

interface Props {
  status: AppointmentStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status]} ${className}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

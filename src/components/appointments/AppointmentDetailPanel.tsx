"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { utcDateToLocal } from "@/lib/time";
import { DatePicker } from "@/components/ui/DatePicker";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { STATUS_LABELS, VALID_TRANSITIONS } from "@/types";
import type { AppointmentWithRelations } from "@/types";
import type { AppointmentStatus } from "@/generated/prisma/client";

interface Props {
  appointment: AppointmentWithRelations;
  onClose: () => void;
  onUpdated: (updated: AppointmentWithRelations) => void;
  canChangeStatus: boolean;
  canReschedule: boolean;
}

function toTimeString(date: Date | string) {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toDateString(date: Date | string) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

const STATUS_BUTTON: Record<AppointmentStatus, string> = {
  REQUESTED:   "bg-amber-50  hover:bg-amber-100  text-amber-800  border-amber-200",
  SCHEDULED:   "bg-blue-50   hover:bg-blue-100   text-blue-800   border-blue-200",
  IN_PROGRESS: "bg-purple-50 hover:bg-purple-100 text-purple-800 border-purple-200",
  COMPLETED:   "bg-green-50  hover:bg-green-100  text-green-800  border-green-200",
  CANCELLED:   "bg-gray-100  hover:bg-gray-200   text-gray-600   border-gray-200",
};

export function AppointmentDetailPanel({
  appointment,
  onClose,
  onUpdated,
  canChangeStatus,
  canReschedule,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(toDateString(appointment.date));
  const [rescheduleStart, setRescheduleStart] = useState(toTimeString(appointment.startTime));
  const [rescheduleEnd, setRescheduleEnd] = useState(toTimeString(appointment.endTime));

  const validNext = VALID_TRANSITIONS[appointment.status];

  async function updateStatus(newStatus: AppointmentStatus) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao atualizar status.");
        return;
      }
      const updated = await res.json();
      onUpdated(updated);
      toast.success(`Movido para: ${STATUS_LABELS[newStatus]}`);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: rescheduleDate, startTime: rescheduleStart, endTime: rescheduleEnd }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao reagendar.");
        return;
      }
      onUpdated(await res.json());
      setShowReschedule(false);
      toast.success("Agendamento reagendado.");
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-2.5 py-2 border border-gray-200 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white";

  return (
    <div className="w-80 shrink-0 border-l border-gray-300 bg-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Detalhes do Agendamento</h3>
          <p className="text-xs text-gray-400 mt-0.5 capitalize">
            {format(utcDateToLocal(appointment.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-300 hover:text-gray-600 hover:bg-gray-100 w-7 h-7 flex items-center justify-center rounded-md transition-colors text-lg leading-none"
        >
          ×
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Main info */}
        <div className="space-y-2">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Paciente</p>
            <p className="text-sm font-semibold text-gray-900">{appointment.patient.user.name}</p>
            <p className="text-xs text-gray-400">{appointment.patient.user.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Dentista</p>
              <p className="text-sm font-medium text-gray-800">{appointment.dentist.user.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">Horário</p>
              <p className="text-sm font-medium text-gray-800">
                {format(new Date(appointment.startTime), "HH:mm")}
                {" – "}
                {format(new Date(appointment.endTime), "HH:mm")}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Status</p>
            <StatusBadge status={appointment.status} />
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200" />

        {/* Notes */}
        {appointment.notes && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Observações</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-md px-3 py-2">{appointment.notes}</p>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">{error}</p>
        )}

        {/* Status change */}
        {canChangeStatus && validNext.length > 0 && (
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Mover para</p>
            <div className="space-y-1.5">
              {validNext.map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={loading}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors disabled:opacity-50 ${STATUS_BUTTON[s]}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reschedule */}
        {canReschedule && (
          <div>
            {!showReschedule ? (
              <button
                onClick={() => setShowReschedule(true)}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
              >
                Reagendar
              </button>
            ) : (
              <form onSubmit={handleReschedule} className="space-y-2.5 bg-gray-50 rounded-md p-3 border border-gray-200">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Reagendar</p>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Data</label>
                  <DatePicker value={rescheduleDate} onChange={setRescheduleDate} required />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Início</label>
                    <input type="time" value={rescheduleStart} onChange={(e) => setRescheduleStart(e.target.value)} required className={inputClass} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">Fim</label>
                    <input type="time" value={rescheduleEnd} onChange={(e) => setRescheduleEnd(e.target.value)} required className={inputClass} />
                  </div>
                </div>
                <div className="flex gap-2 pt-0.5">
                  <button type="button" onClick={() => setShowReschedule(false)}
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-600 hover:bg-gray-100 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium py-1.5 rounded-md transition-colors">
                    {loading ? "Salvando..." : "Confirmar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

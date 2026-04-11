"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

function toDateString(date: Date | string) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

const STATUS_GRADIENT: Record<AppointmentStatus, string> = {
  REQUESTED:   "from-yellow-400 to-amber-500 shadow-amber-200",
  SCHEDULED:   "from-blue-500 to-blue-700 shadow-blue-200",
  IN_PROGRESS: "from-purple-500 to-purple-700 shadow-purple-200",
  COMPLETED:   "from-green-500 to-emerald-600 shadow-green-200",
  CANCELLED:   "from-red-400 to-red-600 shadow-red-200",
};

export function AppointmentModal({
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
      onClose();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReschedule(e: React.FormEvent) {
    e.preventDefault();
    if (!rescheduleDate || !rescheduleStart || !rescheduleEnd) return;
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
      const updated = await res.json();
      onUpdated(updated);
      onClose();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 hover:bg-white hover:border-gray-300 transition-all duration-150";

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">Detalhes do Agendamento</h3>
            <p className="text-sm text-gray-400 mt-0.5 capitalize">
              {format(new Date(appointment.date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-gray-600 hover:bg-gray-100 active:scale-95 w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Paciente</p>
              <p className="font-semibold text-gray-900">{appointment.patient.user.name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Dentista</p>
              <p className="font-semibold text-gray-900">{appointment.dentist.user.name}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Horário</p>
              <p className="font-semibold text-gray-900">
                {format(new Date(appointment.startTime), "HH:mm")} –{" "}
                {format(new Date(appointment.endTime), "HH:mm")}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Status</p>
              <StatusBadge status={appointment.status} />
            </div>
          </div>

          {appointment.notes && (
            <div className="text-sm">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1.5">Observações</p>
              <p className="text-gray-700 bg-gray-50 rounded-xl p-3 text-sm">{appointment.notes}</p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{error}</p>
          )}

          {/* Status transitions */}
          {canChangeStatus && validNext.length > 0 && (
            <div>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2.5">Atualizar Status</p>
              <div className="flex flex-wrap gap-2">
                {validNext.map((s) => (
                  <button
                    key={s}
                    onClick={() => updateStatus(s)}
                    disabled={loading}
                    className={`px-3.5 py-1.5 text-sm font-medium rounded-xl text-white bg-gradient-to-r ${STATUS_GRADIENT[s]} shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm disabled:opacity-50 transition-all duration-150`}
                  >
                    → {STATUS_LABELS[s]}
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
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition-colors"
                >
                  Reagendar
                </button>
              ) : (
                <form onSubmit={handleReschedule} className="space-y-3 bg-gray-50 rounded-2xl p-4 border border-gray-200">
                  <p className="text-gray-400 text-xs uppercase tracking-wide">Reagendar</p>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Data</label>
                    <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} required className={inputClass} />
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Início</label>
                      <input type="time" value={rescheduleStart} onChange={(e) => setRescheduleStart(e.target.value)} required className={inputClass} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">Fim</label>
                      <input type="time" value={rescheduleEnd} onChange={(e) => setRescheduleEnd(e.target.value)} required className={inputClass} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowReschedule(false)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-100 active:scale-[0.98] transition-all duration-150"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 disabled:from-indigo-300 disabled:to-indigo-400 text-white text-sm font-medium py-2 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                    >
                      {loading ? "Salvando..." : "Confirmar"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

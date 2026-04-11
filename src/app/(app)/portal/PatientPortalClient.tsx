"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RequestAppointmentForm } from "./RequestAppointmentForm";
import type { AppointmentWithRelations } from "@/types";
import type { AppointmentStatus } from "@/generated/prisma/client";

interface Props {
  patientId: string;
  patientName: string;
}

const STATUS_LEFT: Record<AppointmentStatus, string> = {
  REQUESTED: "bg-yellow-400",
  SCHEDULED: "bg-blue-500",
  IN_PROGRESS: "bg-purple-500",
  COMPLETED: "bg-green-500",
  CANCELLED: "bg-red-300",
};

export function PatientPortalClient({ patientId, patientName }: Props) {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/appointments");
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const upcoming = appointments.filter((a) =>
    ["REQUESTED", "SCHEDULED", "IN_PROGRESS"].includes(a.status)
  );
  const past = appointments.filter((a) => ["COMPLETED", "CANCELLED"].includes(a.status));

  return (
    <div className="h-full overflow-y-auto px-6 py-6 space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Olá, {patientName.split(" ")[0]}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Seus agendamentos na clínica</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md transition-colors ${
            showForm
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white"
          }`}
        >
          {showForm ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Solicitar agendamento
            </>
          )}
        </button>
      </div>

      {/* Request form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Nova solicitação</h2>
          <RequestAppointmentForm
            patientId={patientId}
            onCreated={() => {
              fetchAppointments();
              setShowForm(false);
            }}
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-sm">Carregando...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Upcoming */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-sm font-semibold text-gray-700">Próximas consultas</h2>
              {upcoming.length > 0 && (
                <span className="text-xs font-medium bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                  {upcoming.length}
                </span>
              )}
            </div>

            {upcoming.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-sm font-medium text-gray-700">Nenhuma consulta agendada</p>
                <p className="text-xs text-gray-400 mt-1">Solicite um agendamento acima</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((appt) => (
                  <AppointmentCard key={appt.id} appt={appt} />
                ))}
              </div>
            )}
          </section>

          {/* History */}
          {past.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-gray-500">Histórico</h2>
                <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {past.length}
                </span>
              </div>
              <div className="space-y-3">
                {past.map((appt) => (
                  <AppointmentCard key={appt.id} appt={appt} muted />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function AppointmentCard({
  appt,
  muted = false,
}: {
  appt: AppointmentWithRelations;
  muted?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex transition-opacity ${
        muted ? "opacity-60" : ""
      }`}
    >
      {/* Status accent */}
      <div className={`w-1.5 shrink-0 ${STATUS_LEFT[appt.status]}`} />

      <div className="flex items-center justify-between gap-4 px-4 py-4 flex-1 min-w-0">
        <div className="space-y-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm capitalize">
            {format(new Date(appt.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {format(new Date(appt.startTime), "HH:mm")} – {format(new Date(appt.endTime), "HH:mm")}
            <span className="text-gray-200 mx-0.5">·</span>
            {appt.dentist.user.name}
          </div>
          {appt.notes && (
            <p className="text-xs text-gray-400 truncate">{appt.notes}</p>
          )}
        </div>
        <StatusBadge status={appt.status} className="shrink-0" />
      </div>
    </div>
  );
}

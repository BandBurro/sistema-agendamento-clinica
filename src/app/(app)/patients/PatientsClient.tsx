"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { NewPatientModal } from "@/components/ui/NewPatientModal";
import type { AppointmentStatus } from "@/generated/prisma/client";

interface PatientRow {
  id: string;
  phone: string;
  user: { id: string; name: string; email: string; active: boolean };
  appointments: { status: AppointmentStatus; date: Date }[];
}

interface Props {
  patients: PatientRow[];
}

function NoBadge() {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-300">
      Sem consultas
    </span>
  );
}

function SearchIcon() {
  return (
    <svg
      className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

export function PatientsClient({ patients: initialPatients }: Props) {
  const [patients, setPatients] = useState(initialPatients);
  const [search, setSearch] = useState("");
  const [showNewPatient, setShowNewPatient] = useState(false);

  async function refreshPatients() {
    const res = await fetch("/api/patients");
    if (res.ok) setPatients(await res.json());
  }

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.user.name.toLowerCase().includes(q) ||
      p.user.email.toLowerCase().includes(q) ||
      p.phone.includes(q)
    );
  });

  return (
    <div className="h-full overflow-y-auto px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {patients.length} paciente{patients.length !== 1 ? "s" : ""} cadastrado
            {patients.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowNewPatient(true)}
          className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Novo Paciente
        </button>
      </div>

      {/* Barra de busca */}
      <div className="relative">
        <SearchIcon />
        <input
          type="text"
          placeholder="Buscar por nome, email ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                {["Nome", "Email", "Telefone", "Última consulta", "Status"].map((h) => (
                  <th
                    key={h}
                    className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 text-sm">
                    {search
                      ? "Nenhum paciente encontrado para essa busca."
                      : "Nenhum paciente cadastrado ainda."}
                  </td>
                </tr>
              ) : (
                filtered.map((patient) => {
                  const lastAppt = patient.appointments[0] ?? null;
                  return (
                    <tr
                      key={patient.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      {/* Nome com avatar */}
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                            <span className="text-xs font-semibold text-indigo-700">
                              {patient.user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{patient.user.name}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-3 text-gray-500">{patient.user.email}</td>

                      {/* Telefone */}
                      <td className="px-6 py-3 text-gray-500">{patient.phone || "—"}</td>

                      {/* Última consulta */}
                      <td className="px-6 py-3 text-gray-500">
                        {lastAppt
                          ? format(lastAppt.date, "dd/MM/yyyy", { locale: ptBR })
                          : "—"}
                      </td>

                      {/* Badge de status colorido */}
                      <td className="px-6 py-3">
                        {lastAppt ? <StatusBadge status={lastAppt.status} /> : <NoBadge />}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de novo paciente */}
      {showNewPatient && (
        <NewPatientModal
          onClose={() => setShowNewPatient(false)}
          onCreated={() => {
            setShowNewPatient(false);
            refreshPatients();
          }}
        />
      )}
    </div>
  );
}

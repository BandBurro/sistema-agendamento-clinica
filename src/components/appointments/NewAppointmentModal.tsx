"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import type { DentistWithUser, PatientWithUser } from "@/types";

interface Props {
  dentists: DentistWithUser[];
  prefill: {
    dentistId: string;
    date: string; // "yyyy-MM-dd"
    startTime: string; // "HH:mm"
    endTime: string; // "HH:mm"
  };
  onClose: () => void;
  onCreated: () => void;
}

export function NewAppointmentModal({ dentists, prefill, onClose, onCreated }: Props) {
  const [patients, setPatients] = useState<PatientWithUser[]>([]);
  const [patientId, setPatientId] = useState("");
  const [dentistId, setDentistId] = useState(prefill.dentistId);
  const [date, setDate] = useState(prefill.date);
  const [startTime, setStartTime] = useState(prefill.startTime);
  const [endTime, setEndTime] = useState(prefill.endTime);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/patients")
      .then((r) => r.json())
      .then(setPatients);
  }, []);

  const TIME_SLOTS = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const min = i % 2 === 0 ? "00" : "30";
    return `${String(hour).padStart(2, "0")}:${min}`;
  }).filter((t) => t < "18:00");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) { setError("Selecione um paciente."); return; }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, dentistId, date, startTime, endTime, notes }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao criar agendamento.");
        return;
      }

      onCreated();
      onClose();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-start justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">Novo Agendamento</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {format(new Date(date + "T12:00:00"), "d 'de' MMMM")} · {startTime}–{endTime}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Paciente</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Selecione um paciente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dentista</label>
            <select
              value={dentistId}
              onChange={(e) => setDentistId(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {dentists.map((d) => (
                <option key={d.id} value={d.id}>{d.user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Data</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Início</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {TIME_SLOTS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fim</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {TIME_SLOTS.filter((t) => t > startTime).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Observações <span className="text-gray-400">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? "Criando..." : "Criar Agendamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

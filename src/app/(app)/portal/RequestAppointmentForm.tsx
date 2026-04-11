"use client";

import { useState, useEffect } from "react";
import type { DentistWithUser } from "@/types";

interface Props {
  patientId: string;
  onCreated: () => void;
}

export function RequestAppointmentForm({ patientId, onCreated }: Props) {
  const [dentists, setDentists] = useState<DentistWithUser[]>([]);
  const [dentistId, setDentistId] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/dentists")
      .then((r) => r.json())
      .then(setDentists);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        setError(data.error || "Erro ao solicitar agendamento.");
        return;
      }

      setSuccess(true);
      setDentistId("");
      setDate("");
      setStartTime("");
      setEndTime("");
      setNotes("");
      onCreated();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  // Generate available time slots
  const TIME_SLOTS = Array.from({ length: 20 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const min = i % 2 === 0 ? "00" : "30";
    return `${String(hour).padStart(2, "0")}:${min}`;
  }).filter((t) => t < "18:00");

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Dentista</label>
        <select
          value={dentistId}
          onChange={(e) => setDentistId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">Selecione um dentista</option>
          {dentists.map((d) => (
            <option key={d.id} value={d.id}>
              {d.user.name} — {d.specialty}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Data preferida</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          min={new Date().toISOString().split("T")[0]}
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
            <option value="">Horário</option>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
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
            <option value="">Horário</option>
            {TIME_SLOTS.filter((t) => t > startTime).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
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
          placeholder="Ex: Dor de dente, limpeza, etc."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          ✓ Solicitação enviada! Aguarde a confirmação da recepção.
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
      >
        {loading ? "Enviando..." : "Solicitar Agendamento"}
      </button>
    </form>
  );
}

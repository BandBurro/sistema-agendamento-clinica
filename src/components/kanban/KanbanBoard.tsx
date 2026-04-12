"use client";

import { useState, useCallback, useEffect } from "react";
import { useServerTime } from "@/hooks/useServerTime";
import { getAppointmentDateTime } from "@/lib/time";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import type { AppointmentWithRelations, DentistWithUser } from "@/types";
import type { AppointmentStatus } from "@/generated/prisma/client";
import { STATUS_LABELS } from "@/types";
import { AppointmentModal } from "@/components/appointments/AppointmentModal";

const COLUMNS: AppointmentStatus[] = [
  "REQUESTED",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

interface Props {
  dentists: DentistWithUser[];
}

export function KanbanBoard({ dentists }: Props) {
  const now = useServerTime();
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dentistFilter, setDentistFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selected, setSelected] = useState<AppointmentWithRelations | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (dentistFilter) params.set("dentistId", dentistFilter);
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    const res = await fetch(`/api/appointments?${params}`);
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  }, [dentistFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const activeAppt = appointments.find((a) => a.id === activeId);

  const getColumnAppts = (status: AppointmentStatus) =>
    appointments.filter((a) => a.status === status);

  function handleDragStart({ active }: DragStartEvent) {
    setActiveId(active.id as string);
  }

  async function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;

    const appt = appointments.find((a) => a.id === active.id);
    if (!appt) return;

    // over.id can be a column status or another card id
    const targetStatus = COLUMNS.includes(over.id as AppointmentStatus)
      ? (over.id as AppointmentStatus)
      : appointments.find((a) => a.id === over.id)?.status;

    if (!targetStatus || targetStatus === appt.status) return;

    // Optimistic update
    setAppointments((prev) =>
      prev.map((a) => (a.id === appt.id ? { ...a, status: targetStatus } : a))
    );

    try {
      const res = await fetch(`/api/appointments/${appt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) {
        // Revert on failure
        setAppointments((prev) =>
          prev.map((a) => (a.id === appt.id ? { ...a, status: appt.status } : a))
        );
      } else {
        const updated = await res.json();
        setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      }
    } catch {
      setAppointments((prev) =>
        prev.map((a) => (a.id === appt.id ? { ...a, status: appt.status } : a))
      );
    }
  }

  function handleDragOver(_event: DragOverEvent) {
    // Could handle reordering within columns here
  }

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        Carregando...
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-6 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-900 mr-auto">Kanban</h1>

        {/* Date range filter */}
        <div className="flex items-center gap-2 text-sm">
          <label className="text-gray-500 text-xs">De</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <label className="text-gray-500 text-xs">até</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            min={dateFrom || undefined}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {(dateFrom || dateTo) && (
            <button
              onClick={() => { setDateFrom(""); setDateTo(""); }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Dentist filter */}
        {dentists.length > 0 && (
          <select
            value={dentistFilter}
            onChange={(e) => setDentistFilter(e.target.value)}
            className="text-sm text-gray-900 border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos os dentistas</option>
            {dentists.map((d) => (
              <option key={d.id} value={d.id}>{d.user.name}</option>
            ))}
          </select>
        )}
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 w-fit mx-auto">
          {COLUMNS.map((status) => {
            const colAppts = getColumnAppts(status);
            return (
              <KanbanColumn
                key={status}
                status={status}
                label={STATUS_LABELS[status]}
                appointments={colAppts}
                onCardClick={(appt) => setSelected(appt)}
              >
                <SortableContext
                  items={colAppts.map((a) => a.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {colAppts.map((appt) => (
                    <KanbanCard
                      key={appt.id}
                      appointment={appt}
                      onClick={() => setSelected(appt)}
                      isPast={getAppointmentDateTime(appt.date, appt.startTime) < now}
                    />
                  ))}
                </SortableContext>
              </KanbanColumn>
            );
          })}
        </div>
        </div>

        <DragOverlay>
          {activeAppt && (
            <KanbanCard appointment={activeAppt} onClick={() => {}} isDragging />
          )}
        </DragOverlay>
      </DndContext>

      {selected && (
        <AppointmentModal
          appointment={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setAppointments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
            setSelected(null);
          }}
          canChangeStatus={true}
          canReschedule={true}
        />
      )}
    </div>
  );
}

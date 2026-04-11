"use client";

import { useMemo } from "react";
import { format, addDays, isSameDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AppointmentWithRelations } from "@/types";
import type { AppointmentStatus } from "@/generated/prisma/client";
import { useServerTime } from "@/hooks/useServerTime";
import { getAppointmentDateTime } from "@/lib/time";

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_HEIGHT = 56; // px per hour
const PX_PER_MIN = HOUR_HEIGHT / 60;
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

const BLOCK_STYLES: Record<AppointmentStatus, string> = {
  REQUESTED:   "bg-amber-50  border-l-amber-400  text-amber-900  hover:bg-amber-100",
  SCHEDULED:   "bg-blue-50   border-l-blue-500   text-blue-900   hover:bg-blue-100",
  IN_PROGRESS: "bg-purple-50 border-l-purple-500 text-purple-900 hover:bg-purple-100",
  COMPLETED:   "bg-green-50  border-l-green-500  text-green-900  hover:bg-green-100",
  CANCELLED:   "bg-gray-100  border-l-gray-300   text-gray-400   line-through hover:bg-gray-150",
};

function formatHour(h: number): string {
  if (h === 0)  return "12am";
  if (h < 12)  return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

interface Props {
  appointments: AppointmentWithRelations[];
  weekStart: Date;
  loading: boolean;
  onNavigate: (newWeekStart: Date) => void;
  onAppointmentClick: (appt: AppointmentWithRelations) => void;
  onDayClick?: (day: Date) => void;
  selectedId?: string;
}

export function WeekCalendar({
  appointments,
  weekStart,
  loading,
  onNavigate,
  onAppointmentClick,
  onDayClick,
  selectedId,
}: Props) {
  const now = useServerTime();
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const weekEnd = addDays(weekStart, 6);
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  function getBlockPosition(appt: AppointmentWithRelations) {
    const start = new Date(appt.startTime);
    const end = new Date(appt.endTime);
    const startMins = start.getUTCHours() * 60 + start.getUTCMinutes() - START_HOUR * 60;
    const endMins   = end.getUTCHours()   * 60 + end.getUTCMinutes()   - START_HOUR * 60;
    return {
      top:    Math.max(0, startMins * PX_PER_MIN),
      height: Math.max((endMins - startMins) * PX_PER_MIN, 22),
    };
  }

  function getDayAppts(day: Date) {
    return appointments.filter((a) => isSameDay(new Date(a.date), day));
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white min-w-0">
      {/* Week navigation */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-200 shrink-0">
        <button
          onClick={() => onNavigate(addDays(weekStart, -7))}
          className="p-1.5 rounded hover:bg-gray-100 active:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-sm font-semibold text-gray-700 min-w-[220px] text-center select-none">
          {format(weekStart, "d 'de' MMM", { locale: ptBR })}
          {" – "}
          {format(weekEnd, "d 'de' MMM 'de' yyyy", { locale: ptBR })}
        </span>

        <button
          onClick={() => onNavigate(addDays(weekStart, 7))}
          className="p-1.5 rounded hover:bg-gray-100 active:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => {
            const now = new Date();
            const day = now.getDay();
            const diff = day === 0 ? -6 : 1 - day;
            const monday = new Date(now);
            monday.setDate(now.getDate() + diff);
            monday.setHours(0, 0, 0, 0);
            onNavigate(monday);
          }}
          className="ml-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2.5 py-1 rounded hover:bg-indigo-50 transition-colors"
        >
          Hoje
        </button>

        {loading && (
          <span className="ml-auto text-xs text-gray-400">Carregando...</span>
        )}
      </div>

      {/* Day headers */}
      <div className="flex border-b border-gray-200 bg-white shrink-0">
        <div className="w-14 shrink-0 border-r border-gray-200" />
        {days.map((day, i) => {
          const today = isToday(day);
          return (
            <button
              key={i}
              onClick={() => onDayClick?.(day)}
              className={`flex-1 py-2 text-center border-l border-gray-200 first:border-l-0 transition-colors ${
                today ? "bg-indigo-50/40" : ""
              } ${onDayClick ? "cursor-pointer hover:bg-indigo-50/60 group" : "cursor-default"}`}
            >
              <p className={`text-xs font-semibold uppercase tracking-wide ${today ? "text-indigo-600" : "text-gray-400"}`}>
                {format(day, "EEE", { locale: ptBR })}
              </p>
              <span
                className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold mt-0.5 transition-colors ${
                  today
                    ? "bg-indigo-600 text-white"
                    : "text-gray-700 group-hover:bg-indigo-100"
                }`}
              >
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Time grid — scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex" style={{ height: TOTAL_HEIGHT }}>
          {/* Time gutter */}
          <div className="w-14 shrink-0 relative border-r border-gray-200">
            {hours.map((h) => (
              <div
                key={h}
                className="absolute w-full text-right pr-2"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT - 9 }}
              >
                <span className="text-xs text-gray-400">{formatHour(h)}</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, i) => {
            const dayAppts = getDayAppts(day);
            const today = isToday(day);

            return (
              <div
                key={i}
                className={`flex-1 relative border-l border-gray-200 first:border-l-0 ${today ? "bg-indigo-50/20" : ""}`}
                style={{ height: TOTAL_HEIGHT }}
              >
                {/* Hour lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-gray-200"
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Half-hour lines */}
                {hours.map((h) => (
                  <div
                    key={`${h}-half`}
                    className="absolute left-0 right-0 border-t border-dashed border-gray-100"
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                  />
                ))}

                {/* Current-time indicator — today's column only */}
                {today && (() => {
                  const nowTop = (now.getUTCHours() + now.getUTCMinutes() / 60 - START_HOUR) * HOUR_HEIGHT;
                  if (nowTop < 0 || nowTop > TOTAL_HEIGHT) return null;
                  return (
                    <div
                      key="now-line"
                      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                      style={{ top: nowTop }}
                    >
                      <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <div className="flex-1 border-t-2 border-rose-500" />
                    </div>
                  );
                })()}

                {/* Appointment blocks */}
                {dayAppts.map((appt) => {
                  const { top, height } = getBlockPosition(appt);
                  const isSelected = appt.id === selectedId;
                  const isPast = getAppointmentDateTime(appt.date, appt.startTime) < now;
                  return (
                    <button
                      key={appt.id}
                      style={{ position: "absolute", top, height, left: 3, right: 3 }}
                      className={`rounded border-l-[3px] px-2 py-0.5 text-left overflow-hidden cursor-pointer transition-all z-10 ${BLOCK_STYLES[appt.status]} ${
                        isSelected ? "ring-2 ring-indigo-400 ring-inset" : ""
                      } ${isPast ? "opacity-50 grayscale" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick(appt);
                      }}
                    >
                      <p className="text-xs font-semibold leading-snug truncate">
                        {appt.patient.user.name}
                      </p>
                      {height >= 32 && (
                        <p className="text-xs leading-tight opacity-60 truncate">
                          {format(new Date(appt.startTime), "HH:mm")}
                          {" – "}
                          {format(new Date(appt.endTime), "HH:mm")}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

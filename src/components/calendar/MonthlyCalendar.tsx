"use client";

import { useState, useEffect, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { STATUS_BG_SOLID } from "@/types";
import type { AppointmentStatus } from "@/generated/prisma/client";

interface CalendarAppointment {
  id: string;
  date: string;
  status: AppointmentStatus;
}

interface Props {
  dentistFilter?: string;
}

export function MonthlyCalendar({ dentistFilter }: Props) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const monthKey = format(currentDate, "yyyy-MM");

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month: monthKey });
    if (dentistFilter) params.set("dentistId", dentistFilter);
    const res = await fetch(`/api/appointments?${params}`);
    if (res.ok) setAppointments(await res.json());
    setLoading(false);
  }, [monthKey, dentistFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const getApptsForDay = (day: Date) =>
    appointments.filter((a) => isSameDay(new Date(a.date), day));

  function navigateMonth(dir: 1 | -1) {
    setCurrentDate((d) => {
      const next = new Date(d);
      next.setMonth(next.getMonth() + dir);
      return next;
    });
  }

  const DAY_HEADERS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900 capitalize">
          {format(currentDate, "MMMM yyyy", { locale: ptBR })}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 active:scale-95 text-gray-400 hover:text-gray-700 transition-all duration-150"
            aria-label="Mês anterior"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-1 text-xs font-medium rounded-lg hover:bg-indigo-50 hover:text-indigo-700 active:bg-indigo-100 active:scale-95 text-gray-500 transition-all duration-150"
          >
            Hoje
          </button>
          <button
            onClick={() => navigateMonth(1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 active:bg-gray-200 active:scale-95 text-gray-400 hover:text-gray-700 transition-all duration-150"
            aria-label="Próximo mês"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DAY_HEADERS.map((d) => (
          <div key={d} className="py-2.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {loading ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          Carregando...
        </div>
      ) : (
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayAppts = getApptsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const todayDay = isToday(day);
            const dateStr = format(day, "yyyy-MM-dd");

            return (
              <button
                key={idx}
                onClick={() => router.push(`/day?date=${dateStr}`)}
                className={`min-h-[80px] p-2 text-left border-r border-b border-gray-100 transition-all duration-150 focus:outline-none group
                  ${!isCurrentMonth ? "bg-gray-50/60" : ""}
                  ${isCurrentMonth && !todayDay ? "hover:bg-gradient-to-br hover:from-indigo-50 hover:to-indigo-100 active:from-indigo-100 active:to-indigo-200" : ""}
                  ${todayDay ? "bg-gradient-to-br from-indigo-50 to-indigo-100" : ""}
                `}
              >
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mb-1 transition-all duration-150 ${
                    todayDay
                      ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-sm"
                      : isCurrentMonth
                        ? "text-gray-800 group-hover:text-indigo-700"
                        : "text-gray-300"
                  }`}
                >
                  {format(day, "d")}
                </span>

                {dayAppts.length > 0 && (
                  <div className="flex flex-wrap gap-0.5 mt-0.5">
                    {dayAppts.slice(0, 5).map((a) => (
                      <span
                        key={a.id}
                        className={`w-2 h-2 rounded-full ${STATUS_BG_SOLID[a.status]} shadow-sm`}
                        title={a.status}
                      />
                    ))}
                    {dayAppts.length > 5 && (
                      <span className="text-xs text-gray-400 leading-none">+{dayAppts.length - 5}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

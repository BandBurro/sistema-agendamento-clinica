"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { format, addDays, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import type { AppointmentWithRelations } from "@/types";
import type { AppointmentStatus } from "@/generated/prisma/client";
import { useServerTime } from "@/hooks/useServerTime";
import { getAppointmentDateTime } from "@/lib/time";

const START_HOUR = 7;
const END_HOUR = 21;
const HOUR_HEIGHT = 56;
const PX_PER_MIN = HOUR_HEIGHT / 60;
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
const SNAP = 15;
const TIME_GUTTER = 56; // w-14

const BLOCK_STYLES: Record<AppointmentStatus, string> = {
  REQUESTED:   "bg-amber-50  border-l-amber-400  text-amber-900",
  SCHEDULED:   "bg-blue-50   border-l-blue-500   text-blue-900",
  IN_PROGRESS: "bg-purple-50 border-l-purple-500 text-purple-900",
  COMPLETED:   "bg-green-50  border-l-green-500  text-green-900",
  CANCELLED:   "bg-gray-100  border-l-gray-300   text-gray-400",
};

function formatHour(h: number): string {
  if (h === 0)  return "12am";
  if (h < 12)  return `${h}am`;
  if (h === 12) return "12pm";
  return `${h - 12}pm`;
}

function minsToHHMM(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function getGridCoords(scrollEl: HTMLDivElement, clientX: number, clientY: number, dayCount: number) {
  const rect = scrollEl.getBoundingClientRect();
  const contentY = clientY - rect.top + scrollEl.scrollTop;
  const contentX = clientX - rect.left;
  const colWidth = (rect.width - TIME_GUTTER) / dayCount;
  const dayIdx = Math.max(0, Math.min(dayCount - 1, Math.floor((contentX - TIME_GUTTER) / colWidth)));
  return { contentY, dayIdx };
}

function yToTime(y: number) {
  const rawMinutes = y / PX_PER_MIN + START_HOUR * 60;
  const snapped = Math.round(rawMinutes / SNAP) * SNAP;
  const clamped = Math.max(START_HOUR * 60, Math.min(END_HOUR * 60, snapped));
  return {
    minutes: clamped,
    hhmm: minsToHHMM(clamped),
    top: (clamped - START_HOUR * 60) * PX_PER_MIN,
  };
}

type Ghost = {
  kind: "reschedule";
  apptId: string;
  dayIdx: number;
  top: number;
  height: number;
  startHHMM: string;
  endHHMM: string;
} | {
  kind: "create";
  dayIdx: number;
  top: number;
  height: number;
  startHHMM: string;
  endHHMM: string;
};

type DragData = {
  kind: "reschedule";
  apptId: string;
  durationMinutes: number;
  grabOffsetY: number;
  startClientX: number;
  startClientY: number;
} | {
  kind: "create";
  dayIdx: number;
  anchorY: number;
};

interface Props {
  appointments: AppointmentWithRelations[];
  weekStart: Date;
  loading: boolean;
  onNavigate: (newWeekStart: Date) => void;
  onAppointmentClick: (appt: AppointmentWithRelations) => void;
  onDayClick?: (day: Date) => void;
  selectedId?: string;
  onReschedule?: (id: string, date: string, startTime: string, endTime: string) => void;
  onCreateRequest?: (date: string, startTime: string, endTime: string) => void;
  canInteract?: boolean;
}

export function WeekCalendar({
  appointments,
  weekStart,
  loading,
  onNavigate,
  onAppointmentClick,
  onDayClick,
  selectedId,
  onReschedule,
  onCreateRequest,
  canInteract,
}: Props) {
  const now = useServerTime();
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const weekEnd = addDays(weekStart, 6);
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragData | null>(null);
  const ghostRef = useRef<Ghost | null>(null);
  const [ghost, setGhostState] = useState<Ghost | null>(null);

  // Always-fresh ref so window event handlers read current values without stale closures
  const liveRef = useRef({ days, appointments, onAppointmentClick, onReschedule, onCreateRequest });
  liveRef.current = { days, appointments, onAppointmentClick, onReschedule, onCreateRequest };

  function setGhost(g: Ghost | null) {
    ghostRef.current = g;
    setGhostState(g);
  }

  function getBlockPosition(appt: AppointmentWithRelations) {
    const start = new Date(appt.startTime);
    const end = new Date(appt.endTime);
    const startMins = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
    const endMins   = end.getHours()   * 60 + end.getMinutes()   - START_HOUR * 60;
    return {
      top:    Math.max(0, startMins * PX_PER_MIN),
      height: Math.max((endMins - startMins) * PX_PER_MIN, 22),
    };
  }

  function getDayAppts(day: Date) {
    const dayStr = format(day, "yyyy-MM-dd");
    return appointments.filter((a) => String(a.date).slice(0, 10) === dayStr);
  }

  function handleApptMouseDown(e: React.MouseEvent, appt: AppointmentWithRelations) {
    if (!canInteract || !onReschedule) return;
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();

    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;
    const coords = getGridCoords(scrollEl, e.clientX, e.clientY, 7);

    const start = new Date(appt.startTime);
    const end = new Date(appt.endTime);
    const durationMinutes =
      (end.getHours() * 60 + end.getMinutes()) - (start.getHours() * 60 + start.getMinutes());
    const { top, height } = getBlockPosition(appt);
    const grabOffsetY = coords.contentY - top;

    const dayStr = String(appt.date).slice(0, 10);
    const dayIdx = days.findIndex((d) => format(d, "yyyy-MM-dd") === dayStr);

    dragRef.current = {
      kind: "reschedule",
      apptId: appt.id,
      durationMinutes,
      grabOffsetY,
      startClientX: e.clientX,
      startClientY: e.clientY,
    };

    setGhost({
      kind: "reschedule",
      apptId: appt.id,
      dayIdx: Math.max(0, dayIdx),
      top,
      height,
      startHHMM: `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`,
      endHHMM: `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
    });

    document.body.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  }

  function handleColumnMouseDown(e: React.MouseEvent, dayIdx: number) {
    if (!canInteract || !onCreateRequest) return;
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-appt]")) return;
    e.preventDefault();

    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;
    const coords = getGridCoords(scrollEl, e.clientX, e.clientY, 7);
    const snapped = yToTime(coords.contentY);

    dragRef.current = { kind: "create", dayIdx, anchorY: snapped.top };

    setGhost({
      kind: "create",
      dayIdx,
      top: snapped.top,
      height: SNAP * PX_PER_MIN,
      startHHMM: snapped.hhmm,
      endHHMM: minsToHHMM(snapped.minutes + SNAP),
    });

    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  }

  // Register window-level drag listeners once; read all live values from refs
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current) return;
      const scrollEl = scrollContainerRef.current;
      if (!scrollEl) return;
      const coords = getGridCoords(scrollEl, e.clientX, e.clientY, 7);

      if (dragRef.current.kind === "reschedule") {
        const { durationMinutes, grabOffsetY, apptId } = dragRef.current;
        const startTime = yToTime(coords.contentY - grabOffsetY);
        const endMins = Math.min(END_HOUR * 60, startTime.minutes + durationMinutes);
        const newGhost: Ghost = {
          kind: "reschedule",
          apptId,
          dayIdx: coords.dayIdx,
          top: startTime.top,
          height: durationMinutes * PX_PER_MIN,
          startHHMM: startTime.hhmm,
          endHHMM: minsToHHMM(endMins),
        };
        ghostRef.current = newGhost;
        setGhostState(newGhost);
      } else {
        const { anchorY, dayIdx } = dragRef.current;
        const anchorMins = anchorY / PX_PER_MIN + START_HOUR * 60;
        const curMins = yToTime(coords.contentY).minutes;
        const rawStart = Math.min(anchorMins, curMins);
        const rawEnd = Math.max(anchorMins, curMins);
        const snappedStart = Math.max(START_HOUR * 60, Math.round(rawStart / SNAP) * SNAP);
        const snappedEnd = Math.min(END_HOUR * 60, Math.max(Math.round(rawEnd / SNAP) * SNAP, snappedStart + SNAP));
        const newGhost: Ghost = {
          kind: "create",
          dayIdx,
          top: (snappedStart - START_HOUR * 60) * PX_PER_MIN,
          height: Math.max((snappedEnd - snappedStart) * PX_PER_MIN, SNAP * PX_PER_MIN),
          startHHMM: minsToHHMM(snappedStart),
          endHHMM: minsToHHMM(snappedEnd),
        };
        ghostRef.current = newGhost;
        setGhostState(newGhost);
      }
    }

    function onUp(e: MouseEvent) {
      if (!dragRef.current) return;
      const drag = dragRef.current;
      const g = ghostRef.current;
      const { days, appointments, onAppointmentClick, onReschedule, onCreateRequest } = liveRef.current;

      if (drag.kind === "reschedule") {
        const moved =
          Math.abs(e.clientX - drag.startClientX) > 6 ||
          Math.abs(e.clientY - drag.startClientY) > 6;
        if (!moved) {
          const appt = appointments.find((a) => a.id === drag.apptId);
          if (appt) onAppointmentClick(appt);
        } else if (g?.kind === "reschedule" && onReschedule) {
          onReschedule(drag.apptId, format(days[g.dayIdx], "yyyy-MM-dd"), g.startHHMM, g.endHHMM);
        }
      } else if (drag.kind === "create" && g?.kind === "create" && onCreateRequest) {
        onCreateRequest(format(days[g.dayIdx], "yyyy-MM-dd"), g.startHHMM, g.endHHMM);
      }

      dragRef.current = null;
      ghostRef.current = null;
      setGhostState(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []); // empty — reads from refs only

  const isDraggable = !!(canInteract && onReschedule);
  const isCreatable = !!(canInteract && onCreateRequest);

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
            const n = new Date();
            const day = n.getDay();
            const diff = day === 0 ? -6 : 1 - day;
            const monday = new Date(n);
            monday.setDate(n.getDate() + diff);
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
      <div className="flex-1 overflow-y-auto" ref={scrollContainerRef}>
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
                className={`flex-1 relative border-l border-gray-200 first:border-l-0 ${today ? "bg-indigo-50/20" : ""} ${isCreatable ? "cursor-cell" : ""}`}
                style={{ height: TOTAL_HEIGHT }}
                onMouseDown={(e) => handleColumnMouseDown(e, i)}
              >
                {/* Hour lines */}
                {hours.map((h) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0 border-t border-gray-200 pointer-events-none"
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                  />
                ))}

                {/* Half-hour lines */}
                {hours.map((h) => (
                  <div
                    key={`${h}-half`}
                    className="absolute left-0 right-0 border-t border-dashed border-gray-100 pointer-events-none"
                    style={{ top: (h - START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
                  />
                ))}

                {/* Current-time indicator */}
                {today && (() => {
                  const nowTop = (now.getHours() + now.getMinutes() / 60 - START_HOUR) * HOUR_HEIGHT;
                  if (nowTop < 0 || nowTop > TOTAL_HEIGHT) return null;
                  return (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                      style={{ top: nowTop }}
                    >
                      <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <div className="flex-1 border-t-2 border-rose-500" />
                    </div>
                  );
                })()}

                {/* Appointment blocks */}
                {dayAppts.map((appt, idx) => {
                  const { top, height } = getBlockPosition(appt);
                  const isSelected = appt.id === selectedId;
                  const isPast = getAppointmentDateTime(appt.date, appt.startTime) < now;
                  const isBeingDragged = ghost?.kind === "reschedule" && ghost.apptId === appt.id;
                  return (
                    <motion.button
                      key={appt.id}
                      data-appt="true"
                      style={{ position: "absolute", top, height, left: 3, right: 3 }}
                      className={`rounded border-l-[3px] px-2 py-0.5 text-left overflow-hidden z-10 transition-opacity ${BLOCK_STYLES[appt.status]} ${
                        isSelected ? "ring-2 ring-indigo-400 ring-inset" : ""
                      } ${isPast ? "grayscale" : ""} ${
                        isDraggable ? "cursor-grab" : "cursor-pointer hover:brightness-105"
                      } ${isBeingDragged ? "opacity-30" : ""}`}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: isBeingDragged ? 0.3 : isPast ? 0.5 : 1, scale: 1 }}
                      transition={{ duration: 0.18, delay: idx * 0.04, ease: "easeOut" }}
                      whileHover={!isDraggable ? { scale: 1.02, zIndex: 20 } : undefined}
                      whileTap={!isDraggable ? { scale: 0.97 } : undefined}
                      onMouseDown={isDraggable ? (e) => handleApptMouseDown(e, appt) : undefined}
                      onClick={!isDraggable ? (e) => { e.stopPropagation(); onAppointmentClick(appt); } : undefined}
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
                    </motion.button>
                  );
                })}

                {/* Reschedule ghost */}
                {ghost?.kind === "reschedule" && ghost.dayIdx === i && (
                  <div
                    className="absolute left-1 right-1 z-30 pointer-events-none rounded border-l-[3px] border-l-indigo-500 bg-indigo-100/80 shadow-lg"
                    style={{ top: ghost.top, height: ghost.height }}
                  >
                    <p className="text-xs text-indigo-700 font-semibold px-1.5 pt-0.5 truncate">
                      {ghost.startHHMM} – {ghost.endHHMM}
                    </p>
                  </div>
                )}

                {/* Create ghost */}
                {ghost?.kind === "create" && ghost.dayIdx === i && (
                  <div
                    className="absolute left-1 right-1 z-30 pointer-events-none rounded border border-dashed border-indigo-400 bg-indigo-50/80"
                    style={{ top: ghost.top, height: ghost.height }}
                  >
                    <p className="text-xs text-indigo-500 font-medium px-1.5 pt-0.5 truncate">
                      {ghost.startHHMM} – {ghost.endHHMM}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

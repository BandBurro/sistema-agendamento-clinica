"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
  parse,
  isValid,
  isSameDay,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  value: string; // "yyyy-MM-dd"
  onChange: (date: string) => void;
  required?: boolean;
  label?: string;
}

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function DatePicker({ value, onChange, required }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(() => {
    if (!value) return null;
    const d = parse(value, "yyyy-MM-dd", new Date());
    return isValid(d) ? d : null;
  }, [value]);

  const [viewMonth, setViewMonth] = useState<Date>(() => selected ?? new Date());

  useEffect(() => setMounted(true), []);

  const openCalendar = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: Math.max(rect.width, 280),
    });
    setViewMonth(selected ?? new Date());
    setOpen(true);
  }, [selected]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    }

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  function selectDay(day: Date) {
    onChange(format(day, "yyyy-MM-dd"));
    setOpen(false);
  }

  const popoverContent = open && mounted ? (
    <div
      ref={popoverRef}
      style={{
        position: "absolute",
        top: popoverPos.top,
        left: popoverPos.left,
        width: popoverPos.width,
        zIndex: 9999,
      }}
      className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 select-none"
    >
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setViewMonth((m) => subMonths(m, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 text-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-sm font-semibold text-gray-800 capitalize">
          {format(viewMonth, "MMMM yyyy", { locale: ptBR })}
        </span>

        <button
          type="button"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 active:bg-gray-200 text-gray-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEK_DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wide text-gray-400 py-1">
            {d.slice(0, 1)}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((day, i) => {
          const inMonth = isSameMonth(day, viewMonth);
          const isSelected = selected ? isSameDay(day, selected) : false;
          const todayDay = isToday(day);

          return (
            <button
              key={i}
              type="button"
              onClick={() => selectDay(day)}
              className={`
                mx-auto w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium
                transition-all duration-100 active:scale-95
                ${isSelected
                  ? "bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-md shadow-indigo-200"
                  : todayDay && inMonth
                    ? "ring-2 ring-inset ring-indigo-300 text-indigo-600 hover:bg-indigo-50"
                    : inMonth
                      ? "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                      : "text-gray-300 hover:bg-gray-50 hover:text-gray-500"
                }
              `}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400 capitalize">
          {selected
            ? format(selected, "EEEE, d 'de' MMMM", { locale: ptBR })
            : "Nenhuma data selecionada"}
        </span>
        <button
          type="button"
          onClick={() => { selectDay(new Date()); setViewMonth(new Date()); }}
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors px-2 py-0.5 rounded hover:bg-indigo-50"
        >
          Hoje
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open ? () => setOpen(false) : openCalendar}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 border rounded-xl text-sm transition-all duration-150 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
          open
            ? "border-indigo-400 ring-2 ring-indigo-100"
            : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <svg
          className={`w-4 h-4 shrink-0 transition-colors ${open ? "text-indigo-500" : "text-gray-400"}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className={selected ? "text-gray-900 font-medium capitalize" : "text-gray-400"}>
          {selected
            ? format(selected, "d 'de' MMMM 'de' yyyy", { locale: ptBR })
            : "Selecione uma data"}
        </span>
        <svg
          className={`w-3.5 h-3.5 ml-auto shrink-0 text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Hidden input keeps native form validation */}
      {required && <input type="hidden" value={value} required />}

      {/* Portal-rendered popover — escapes dialog overflow:hidden */}
      {mounted && createPortal(popoverContent, document.body)}
    </>
  );
}

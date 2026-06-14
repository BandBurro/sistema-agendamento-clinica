"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { format } from "date-fns";
import type { Role } from "@/generated/prisma/client";
import type { DentistWithUser } from "@/types";
import { NewPatientModal } from "./NewPatientModal";
import { NewAppointmentModal } from "@/components/appointments/NewAppointmentModal";

interface Props {
  role: Role;
}

function CalendarIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}


function KanbanIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

interface NavLink {
  href: string;
  label: string;
  roles: Role[];
  icon: React.ReactNode;
}

const navLinks: NavLink[] = [
  { href: "/dashboard", label: "Calendário",        roles: ["ADMIN", "RECEPTIONIST", "DENTIST"], icon: <CalendarIcon /> },
  { href: "/kanban",    label: "Kanban",             roles: ["ADMIN", "RECEPTIONIST"],            icon: <KanbanIcon /> },
  { href: "/patients",  label: "Pacientes",          roles: ["ADMIN", "RECEPTIONIST", "DENTIST"], icon: <UsersIcon /> },
  { href: "/portal",    label: "Meus Agendamentos", roles: ["PATIENT"],                          icon: <ClipboardIcon /> },
  { href: "/admin",     label: "Administração",     roles: ["ADMIN"],                            icon: <SettingsIcon /> },
];

export function Sidebar({ role }: Props) {
  const pathname = usePathname();
  const [showNewPatient, setShowNewPatient] = useState(false);
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [dentists, setDentists] = useState<DentistWithUser[]>([]);

  const links = navLinks.filter((l) => l.roles.includes(role));
  const canRegisterPatient = role === "ADMIN" || role === "RECEPTIONIST";

  async function openNewAppt() {
    if (dentists.length === 0) {
      const res = await fetch("/api/dentists");
      if (res.ok) setDentists(await res.json());
    }
    setShowNewAppt(true);
  }

  return (
    <>
      <aside className="w-52 shrink-0 h-full flex flex-col bg-gray-50 border-r border-gray-200 overflow-y-auto">
        <nav className="flex-1 px-2 py-3 space-y-0.5">
          {links.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <span className={active ? "text-indigo-600" : "text-gray-400"}>{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
        </nav>

        {canRegisterPatient && (
          <div className="px-3 pb-3 pt-2 border-t border-gray-200 space-y-2">
            <button
              onClick={openNewAppt}
              className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium px-3 py-2 rounded-md transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Nova Consulta
            </button>
            <button
              onClick={() => setShowNewPatient(true)}
              className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 border border-gray-300 text-sm font-medium px-3 py-2 rounded-md transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Novo Paciente
            </button>
          </div>
        )}
      </aside>

      {showNewPatient && (
        <NewPatientModal
          onClose={() => setShowNewPatient(false)}
          onCreated={() => setShowNewPatient(false)}
        />
      )}

      {showNewAppt && dentists.length > 0 && (
        <NewAppointmentModal
          dentists={dentists}
          prefill={{
            dentistId: dentists[0].id,
            date: format(new Date(), "yyyy-MM-dd"),
            startTime: "09:00",
            endTime: "10:00",
          }}
          onClose={() => setShowNewAppt(false)}
          onCreated={() => setShowNewAppt(false)}
        />
      )}
    </>
  );
}

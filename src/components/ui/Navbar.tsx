"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import type { Role } from "@/generated/prisma/client";
import { NewPatientModal } from "./NewPatientModal";

interface Props {
  userName: string;
  role: Role;
}

const navLinks: { href: string; label: string; roles: Role[] }[] = [
  { href: "/dashboard", label: "Calendário", roles: ["ADMIN", "RECEPTIONIST", "DENTIST"] },
  { href: "/day", label: "Dia", roles: ["ADMIN", "RECEPTIONIST", "DENTIST"] },
  { href: "/kanban", label: "Kanban", roles: ["ADMIN", "RECEPTIONIST"] },
  { href: "/portal", label: "Meus Agendamentos", roles: ["PATIENT"] },
  { href: "/admin", label: "Administração", roles: ["ADMIN"] },
];

export function Navbar({ userName, role }: Props) {
  const pathname = usePathname();
  const [showNewPatient, setShowNewPatient] = useState(false);

  const links = navLinks.filter((l) => l.roles.includes(role));
  const canRegisterPatient = role === "ADMIN" || role === "RECEPTIONIST";

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-6">
              <Link href="/" className="text-indigo-600 font-bold text-lg shrink-0">
                🦷 Clínica
              </Link>
              <div className="hidden sm:flex items-center gap-1">
                {links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      pathname.startsWith(link.href)
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {canRegisterPatient && (
                <button
                  onClick={() => setShowNewPatient(true)}
                  className="hidden sm:block text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  + Paciente
                </button>
              )}
              <span className="text-sm text-gray-500 hidden sm:block">
                {userName} <span className="text-gray-400">·</span>{" "}
                <span className="text-xs text-gray-400">{role}</span>
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {showNewPatient && (
        <NewPatientModal
          onClose={() => setShowNewPatient(false)}
          onCreated={() => setShowNewPatient(false)}
        />
      )}
    </>
  );
}

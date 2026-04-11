"use client";

import { signOut } from "next-auth/react";
import type { Role } from "@/generated/prisma/client";

interface Props {
  userName: string;
  role: Role;
}

const ROLE_LABELS: Record<Role, string> = {
  ADMIN:        "Administrador",
  RECEPTIONIST: "Recepcionista",
  DENTIST:      "Dentista",
  PATIENT:      "Paciente",
};

export function TopBar({ userName, role }: Props) {
  return (
    <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 shrink-0 z-20">
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 bg-indigo-600 rounded-md flex items-center justify-center text-white text-sm shrink-0">
          🦷
        </div>
        <span className="font-bold text-gray-900 text-sm">Clínica Dental</span>
      </div>

      {/* User */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-800 leading-tight">{userName}</p>
          <p className="text-xs text-gray-400 leading-tight">{ROLE_LABELS[role]}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-sm font-bold select-none">
          {userName.charAt(0).toUpperCase()}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-400 hover:text-gray-700 px-2.5 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
        >
          Sair
        </button>
      </div>
    </div>
  );
}

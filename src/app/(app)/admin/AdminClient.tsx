"use client";

import { useState, useEffect } from "react";
import type { Role } from "@/generated/prisma/client";
import type { WorkingHour } from "@/types";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

interface DentistRow {
  id: string;
  specialty: string;
  workingHours: WorkingHour[];
  user: { id: string; name: string; email: string };
}

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  DENTIST: "Dentista",
  RECEPTIONIST: "Recepcionista",
  PATIENT: "Paciente",
};

const DAYS: { value: WorkingHour["day"]; label: string }[] = [
  { value: "MONDAY", label: "Segunda" },
  { value: "TUESDAY", label: "Terça" },
  { value: "WEDNESDAY", label: "Quarta" },
  { value: "THURSDAY", label: "Quinta" },
  { value: "FRIDAY", label: "Sexta" },
  { value: "SATURDAY", label: "Sábado" },
  { value: "SUNDAY", label: "Domingo" },
];

type Tab = "users" | "dentists";

export function AdminClient() {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [dentists, setDentists] = useState<DentistRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingDentists, setLoadingDentists] = useState(true);

  // User form state
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({ name: "", email: "", password: "", role: "PATIENT" as Role });
  const [userFormError, setUserFormError] = useState("");
  const [userFormLoading, setUserFormLoading] = useState(false);

  // Dentist editing state
  const [editingDentist, setEditingDentist] = useState<DentistRow | null>(null);

  async function fetchUsers() {
    setLoadingUsers(true);
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setLoadingUsers(false);
  }

  async function fetchDentists() {
    setLoadingDentists(true);
    const res = await fetch("/api/dentists");
    if (res.ok) setDentists(await res.json());
    setLoadingDentists(false);
  }

  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { if (tab === "dentists") fetchDentists(); }, [tab]);

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setUserFormError("");
    setUserFormLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userForm),
    });
    if (!res.ok) {
      const data = await res.json();
      setUserFormError(data.error || "Erro ao criar usuário.");
      setUserFormLoading(false);
      return;
    }
    setShowUserForm(false);
    setUserForm({ name: "", email: "", password: "", role: "PATIENT" });
    fetchUsers();
    setUserFormLoading(false);
  }

  async function toggleActive(user: UserRow) {
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    fetchUsers();
  }

  async function changeRole(userId: string, role: Role) {
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    fetchUsers();
  }

  async function saveDentist(dentist: DentistRow) {
    await fetch(`/api/dentists/${dentist.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ specialty: dentist.specialty, workingHours: dentist.workingHours }),
    });
    setEditingDentist(null);
    fetchDentists();
  }

  const stats = {
    total: users.length,
    active: users.filter((u) => u.active).length,
    byRole: Object.fromEntries(
      (["ADMIN", "DENTIST", "RECEPTIONIST", "PATIENT"] as Role[]).map((r) => [
        r,
        users.filter((u) => u.role === r).length,
      ])
    ),
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Administração</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Ativos" value={stats.active} />
        {(["ADMIN", "DENTIST", "RECEPTIONIST", "PATIENT"] as Role[]).map((r) => (
          <StatCard key={r} label={ROLE_LABELS[r]} value={stats.byRole[r]} />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-1">
        {(["users", "dentists"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t === "users" ? "Usuários" : "Dentistas"}
          </button>
        ))}
      </div>

      {/* Users tab */}
      {tab === "users" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Usuários</h2>
            <button
              onClick={() => setShowUserForm((v) => !v)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              {showUserForm ? "Cancelar" : "+ Novo Usuário"}
            </button>
          </div>

          {showUserForm && (
            <form onSubmit={handleCreateUser} className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  placeholder="Nome"
                  value={userForm.name}
                  onChange={(e) => setUserForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={userForm.email}
                  onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                  required
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="password"
                  placeholder="Senha (mín. 6 caracteres)"
                  value={userForm.password}
                  onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                  required
                  minLength={6}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value as Role }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  {(["ADMIN", "DENTIST", "RECEPTIONIST", "PATIENT"] as Role[]).map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              {userFormError && <p className="text-sm text-red-600 mt-3">{userFormError}</p>}
              <button
                type="submit"
                disabled={userFormLoading}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {userFormLoading ? "Criando..." : "Criar Usuário"}
              </button>
            </form>
          )}

          {loadingUsers ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {["Nome", "Email", "Perfil", "Status", "Ações"].map((h) => (
                      <th key={h} className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-3 font-medium text-gray-900">{user.name}</td>
                      <td className="px-6 py-3 text-gray-500">{user.email}</td>
                      <td className="px-6 py-3">
                        <select
                          value={user.role}
                          onChange={(e) => changeRole(user.id, e.target.value as Role)}
                          className="text-xs text-gray-900 border border-gray-200 rounded-md px-2 py-1 bg-white"
                        >
                          {(["ADMIN", "DENTIST", "RECEPTIONIST", "PATIENT"] as Role[]).map((r) => (
                            <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${user.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {user.active ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <button onClick={() => toggleActive(user)} className="text-xs text-gray-500 hover:text-gray-900 underline transition-colors">
                          {user.active ? "Desativar" : "Ativar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Dentists tab */}
      {tab === "dentists" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-900">Dentistas</h2>
            <p className="text-xs text-gray-400 mt-0.5">Gerencie especialidades e horários de atendimento.</p>
          </div>

          {loadingDentists ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Carregando...</div>
          ) : dentists.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
              Nenhum dentista cadastrado. Crie um usuário com perfil Dentista na aba Usuários.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {dentists.map((dentist) => (
                <DentistRow
                  key={dentist.id}
                  dentist={dentist}
                  isEditing={editingDentist?.id === dentist.id}
                  editingData={editingDentist?.id === dentist.id ? editingDentist : null}
                  onEdit={() => setEditingDentist({ ...dentist, workingHours: [...dentist.workingHours] })}
                  onCancel={() => setEditingDentist(null)}
                  onSave={() => saveDentist(editingDentist!)}
                  onChangeEditing={(updated) => setEditingDentist(updated)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DentistRow({
  dentist,
  isEditing,
  editingData,
  onEdit,
  onCancel,
  onSave,
  onChangeEditing,
}: {
  dentist: DentistRow;
  isEditing: boolean;
  editingData: DentistRow | null;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChangeEditing: (d: DentistRow) => void;
}) {
  if (!isEditing) {
    return (
      <div className="px-6 py-4 flex items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-3">
            <p className="font-medium text-gray-900">{dentist.user.name}</p>
            <span className="text-xs text-gray-400">{dentist.user.email}</span>
          </div>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Especialidade:</span> {dentist.specialty}
          </p>
          <div className="flex flex-wrap gap-2">
            {dentist.workingHours.map((wh) => {
              const day = DAYS.find((d) => d.value === wh.day)?.label ?? wh.day;
              return (
                <span key={wh.day} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  {day}: {wh.start}–{wh.end}
                </span>
              );
            })}
            {dentist.workingHours.length === 0 && (
              <span className="text-xs text-gray-400 italic">Sem horários definidos.</span>
            )}
          </div>
        </div>
        <button onClick={onEdit} className="text-sm text-indigo-600 hover:underline shrink-0">Editar</button>
      </div>
    );
  }

  const data = editingData!;

  function toggleDay(day: WorkingHour["day"]) {
    const exists = data.workingHours.find((wh) => wh.day === day);
    const updated = exists
      ? data.workingHours.filter((wh) => wh.day !== day)
      : [...data.workingHours, { day, start: "08:00", end: "18:00" }];
    onChangeEditing({ ...data, workingHours: updated });
  }

  function updateHour(day: WorkingHour["day"], field: "start" | "end", value: string) {
    onChangeEditing({
      ...data,
      workingHours: data.workingHours.map((wh) =>
        wh.day === day ? { ...wh, [field]: value } : wh
      ),
    });
  }

  return (
    <div className="px-6 py-5 bg-indigo-50 border-l-4 border-indigo-400 space-y-4">
      <p className="font-medium text-gray-900">{dentist.user.name}</p>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Especialidade</label>
        <input
          value={data.specialty}
          onChange={(e) => onChangeEditing({ ...data, specialty: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full max-w-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Horários de Atendimento</label>
        <div className="space-y-2">
          {DAYS.map(({ value: day, label }) => {
            const wh = data.workingHours.find((h) => h.day === day);
            const active = !!wh;
            return (
              <div key={day} className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`w-24 text-left text-xs px-2 py-1 rounded-md border transition-colors ${
                    active
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-500 border-gray-300 hover:border-gray-400"
                  }`}
                >
                  {label}
                </button>
                {active && (
                  <>
                    <input
                      type="time"
                      value={wh!.start}
                      onChange={(e) => updateHour(day, "start", e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-gray-400">até</span>
                    <input
                      type="time"
                      value={wh!.end}
                      onChange={(e) => updateHour(day, "end", e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSave}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          Salvar
        </button>
        <button
          onClick={onCancel}
          className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

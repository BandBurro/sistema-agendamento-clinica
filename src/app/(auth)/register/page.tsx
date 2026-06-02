"use client";

import { useState } from "react";
import Link from "next/link";
import { registerSchema } from "@/lib/validations/auth";
import { fetchAddressByCep } from "@/services/viacep";

type FieldErrors = Partial<Record<string, string>>;

type CepLookupStatus = "idle" | "loading" | "not-found";

function getPasswordStrength(pwd: string): 0 | 1 | 2 | 3 {
  if (pwd.length === 0) return 0;
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  return score as 0 | 1 | 2 | 3;
}

const STRENGTH_LABEL = ["", "Fraca", "Média", "Forte"] as const;
const STRENGTH_COLOR = [
  "",
  "bg-red-400",
  "bg-amber-400",
  "bg-green-500",
] as const;

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.477 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dateOfBirth: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cepStatus, setCepStatus] = useState<CepLookupStatus>("idle");

  // Success state
  const [registered, setRegistered] = useState(false);
  const [devVerifyLink, setDevVerifyLink] = useState<string | null>(null);

  const strength = getPasswordStrength(form.password);

  function setField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  async function handleCepBlur() {
    const digits = form.cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setCepStatus("idle");
      return;
    }
    setCepStatus("loading");
    const address = await fetchAddressByCep(digits);
    if (!address) {
      setCepStatus("not-found");
      return;
    }
    setForm((prev) => ({
      ...prev,
      logradouro: address.logradouro || prev.logradouro,
      complemento: address.complemento || prev.complemento,
      bairro: address.bairro || prev.bairro,
      cidade: address.localidade || prev.cidade,
      uf: address.uf || prev.uf,
    }));
    setCepStatus("idle");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    // Client-side Zod validation
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      const errs: FieldErrors = {};
      for (const [k, msgs] of Object.entries(flat)) {
        if (msgs?.[0]) errs[k] = msgs[0];
      }
      setFieldErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json() as { error?: string; devVerifyLink?: string };

      if (!res.ok) {
        setServerError(data.error ?? "Erro ao criar conta.");
        setLoading(false);
        return;
      }

      // Show success state — dev link present in development
      setDevVerifyLink(data.devVerifyLink ?? null);
      setRegistered(true);
    } catch {
      setServerError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  const inputClass =
    "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white hover:border-gray-300 placeholder:text-gray-300 transition-all duration-150";

  const fieldErrorClass = "mt-1 text-xs text-red-500";

  // ── Success screen ─────────────────────────────────────────────────────────
  if (registered) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="w-full max-w-sm">
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-2.5">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white text-sm shadow-md shadow-indigo-200">
                  🦷
                </div>
                <span className="font-bold text-gray-900">Clínica Dental</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-gray-900 mb-1">Verifique seu email</h1>
              <p className="text-sm text-gray-500 mb-1">
                Enviamos um link de verificação para
              </p>
              <p className="text-sm font-medium text-gray-800 mb-5">{form.email}</p>
              <p className="text-xs text-gray-400 mb-6">
                Clique no link no email para ativar sua conta. O link expira em 24 horas.
              </p>

              {devVerifyLink && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mb-4">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">
                    Ambiente de desenvolvimento
                  </p>
                  <p className="text-xs text-amber-600 mb-3">
                    Nenhum email real foi enviado. Use o link abaixo para verificar sua conta:
                  </p>
                  <a
                    href={devVerifyLink}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:underline break-all"
                  >
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Clique aqui para verificar →
                  </a>
                </div>
              )}

              <Link
                href="/login"
                className="inline-block w-full border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                Ir para o login
              </Link>
            </div>
          </div>
        </div>
      );
  }

  // ── Register form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex w-[40%] bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-white/5 rounded-full" />
        <div className="relative text-center text-white max-w-xs">
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-7 shadow-inner border border-white/20">
            🦷
          </div>
          <h2 className="text-2xl font-bold mb-3">Crie sua conta</h2>
          <p className="text-blue-200 text-sm mb-8 leading-relaxed">
            Agende consultas, acompanhe seu histórico e receba lembretes pelo WhatsApp
          </p>
          <ul className="space-y-3 text-left">
            {[
              "Solicite agendamentos online",
              "Acompanhe o status das consultas",
              "Histórico completo de atendimentos",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-blue-100">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-white overflow-y-auto">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2.5 mb-7">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white text-sm shadow-md shadow-indigo-200">
                🦷
              </div>
              <span className="font-bold text-gray-900">Clínica Dental</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Criar conta de paciente</h1>
            <p className="text-gray-400 mt-1.5 text-sm">Preencha seus dados para se registrar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                className={`${inputClass} ${fieldErrors.name ? "border-red-300 focus:ring-red-400" : ""}`}
                placeholder="João da Silva"
              />
              {fieldErrors.name && <p className={fieldErrorClass}>{fieldErrors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
                className={`${inputClass} ${fieldErrors.email ? "border-red-300 focus:ring-red-400" : ""}`}
                placeholder="seu@email.com"
              />
              {fieldErrors.email && <p className={fieldErrorClass}>{fieldErrors.email}</p>}
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  className={`${inputClass} pr-10 ${fieldErrors.password ? "border-red-300 focus:ring-red-400" : ""}`}
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  <EyeIcon open={showPassword} />
                </button>
              </div>
              {fieldErrors.password && <p className={fieldErrorClass}>{fieldErrors.password}</p>}

              {/* Password strength indicator */}
              {form.password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                          strength >= i ? STRENGTH_COLOR[strength] : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-400">
                    Força:{" "}
                    <span
                      className={
                        strength === 1
                          ? "text-red-500 font-medium"
                          : strength === 2
                          ? "text-amber-500 font-medium"
                          : "text-green-600 font-medium"
                      }
                    >
                      {STRENGTH_LABEL[strength]}
                    </span>
                  </p>
                  <ul className="text-xs space-y-0.5">
                    <Req ok={form.password.length >= 8} label="Mínimo 8 caracteres" />
                    <Req ok={/[A-Z]/.test(form.password)} label="Uma letra maiúscula" />
                    <Req ok={/[0-9]/.test(form.password)} label="Um número" />
                  </ul>
                </div>
              )}
            </div>

            {/* Confirmar senha */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirmar senha</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) => setField("confirmPassword", e.target.value)}
                  className={`${inputClass} pr-10 ${fieldErrors.confirmPassword ? "border-red-300 focus:ring-red-400" : ""}`}
                  placeholder="Repita a senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className={fieldErrorClass}>{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone (WhatsApp)</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
                className={`${inputClass} ${fieldErrors.phone ? "border-red-300 focus:ring-red-400" : ""}`}
                placeholder="+55 11 99999-0000"
              />
              {fieldErrors.phone && <p className={fieldErrorClass}>{fieldErrors.phone}</p>}
            </div>

            {/* Data de nascimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Data de nascimento</label>
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => setField("dateOfBirth", e.target.value)}
                className={`${inputClass} ${fieldErrors.dateOfBirth ? "border-red-300 focus:ring-red-400" : ""}`}
              />
              {fieldErrors.dateOfBirth && (
                <p className={fieldErrorClass}>{fieldErrors.dateOfBirth}</p>
              )}
            </div>

            {/* Endereço */}
            <fieldset className="space-y-3 pt-2 border-t border-gray-100">
              <legend className="text-sm font-medium text-gray-700 pt-3">
                Endereço <span className="text-gray-400 font-normal">(opcional)</span>
              </legend>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">CEP</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.cep}
                  onChange={(e) => {
                    setField("cep", e.target.value);
                    if (cepStatus !== "idle") setCepStatus("idle");
                  }}
                  onBlur={handleCepBlur}
                  className={`${inputClass} ${fieldErrors.cep ? "border-red-300 focus:ring-red-400" : ""}`}
                  placeholder="01310-100"
                  maxLength={9}
                />
                {fieldErrors.cep && <p className={fieldErrorClass}>{fieldErrors.cep}</p>}
                {cepStatus === "loading" && (
                  <p className="mt-1 text-xs text-gray-400">Buscando endereço…</p>
                )}
                {cepStatus === "not-found" && (
                  <p className="mt-1 text-xs text-amber-600">
                    CEP não encontrado — você pode preencher os campos manualmente.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Logradouro</label>
                  <input
                    type="text"
                    value={form.logradouro}
                    onChange={(e) => setField("logradouro", e.target.value)}
                    className={inputClass}
                    placeholder="Rua, avenida..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Número</label>
                  <input
                    type="text"
                    value={form.numero}
                    onChange={(e) => setField("numero", e.target.value)}
                    className={inputClass}
                    placeholder="123"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Complemento</label>
                <input
                  type="text"
                  value={form.complemento}
                  onChange={(e) => setField("complemento", e.target.value)}
                  className={inputClass}
                  placeholder="Apto, bloco..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Bairro</label>
                <input
                  type="text"
                  value={form.bairro}
                  onChange={(e) => setField("bairro", e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
                  <input
                    type="text"
                    value={form.cidade}
                    onChange={(e) => setField("cidade", e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">UF</label>
                  <input
                    type="text"
                    value={form.uf}
                    onChange={(e) => setField("uf", e.target.value.toUpperCase())}
                    className={`${inputClass} ${fieldErrors.uf ? "border-red-300 focus:ring-red-400" : ""}`}
                    placeholder="SP"
                    maxLength={2}
                  />
                  {fieldErrors.uf && <p className={fieldErrorClass}>{fieldErrors.uf}</p>}
                </div>
              </div>
            </fieldset>

            {serverError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 text-white font-medium py-2.5 rounded-md text-sm transition-colors"
            >
              {loading ? "Criando conta..." : "Criar conta"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Já tem conta?{" "}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function Req({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${ok ? "text-green-600" : "text-gray-400"}`}>
      <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {ok ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        ) : (
          <circle cx="12" cy="12" r="4" strokeWidth={2} />
        )}
      </svg>
      {label}
    </li>
  );
}

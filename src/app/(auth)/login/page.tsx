"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);

    if (result?.error) {
      setError("Email ou senha incorretos.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex">
      {/* Left — form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2.5 mb-7">
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white text-sm shadow-md shadow-indigo-200">
                🦷
              </div>
              <span className="font-bold text-gray-900">Clínica Dental</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h1>
            <p className="text-gray-400 mt-1.5 text-sm">Faça login para acessar o sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white hover:border-gray-300 placeholder:text-gray-300 transition-all duration-150"
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50 hover:bg-white hover:border-gray-300 placeholder:text-gray-300 transition-all duration-150"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 text-white font-medium py-2.5 rounded-md text-sm transition-colors"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Não tem conta?{" "}
            <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
              Registre-se como paciente
            </Link>
          </p>
        </div>
      </div>

      {/* Right — brand panel */}
      <div className="hidden lg:flex w-[46%] bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute top-1/3 -right-16 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 bg-white/5 rounded-full" />

        <div className="relative text-center text-white max-w-sm">
          <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-8 shadow-inner border border-white/20 backdrop-blur-sm">
            🦷
          </div>
          <h2 className="text-3xl font-bold mb-3">Clínica Dental</h2>
          <p className="text-blue-200 text-sm mb-10 leading-relaxed">
            Sistema de gestão completo para sua clínica odontológica
          </p>
          <ul className="space-y-3 text-left">
            {[
              "Agendamentos e calendário integrado",
              "Gestão de dentistas e pacientes",
              "Notificações automáticas via WhatsApp",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-blue-100">
                <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-sm">
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
    </div>
  );
}

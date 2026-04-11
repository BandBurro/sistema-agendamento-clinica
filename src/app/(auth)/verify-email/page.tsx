"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type State = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [state, setState] = useState<State>("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setErrorMsg("Link inválido. O token não foi encontrado.");
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then((res) => res.json())
      .then((data: { error?: string }) => {
        if (data.error) {
          setState("error");
          setErrorMsg(data.error);
        } else {
          setState("success");
        }
      })
      .catch(() => {
        setState("error");
        setErrorMsg("Erro de conexão. Tente novamente.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white text-sm shadow-md shadow-indigo-200">
              🦷
            </div>
            <span className="font-bold text-gray-900">Clínica Dental</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          {state === "loading" && (
            <>
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-indigo-500 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-gray-900 mb-1">
                Verificando seu email…
              </h1>
              <p className="text-sm text-gray-400">Aguarde um momento.</p>
            </>
          )}

          {state === "success" && (
            <>
              <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-gray-900 mb-1">
                Email verificado!
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Sua conta foi ativada com sucesso. Agora você pode entrar.
              </p>
              <Link
                href="/login"
                className="inline-block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                Entrar na conta
              </Link>
            </>
          )}

          {state === "error" && (
            <>
              <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-7 h-7 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h1 className="text-lg font-semibold text-gray-900 mb-1">
                Link inválido
              </h1>
              <p className="text-sm text-gray-500 mb-6">{errorMsg}</p>
              <Link
                href="/register"
                className="inline-block w-full border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-xl transition-colors"
              >
                Criar nova conta
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

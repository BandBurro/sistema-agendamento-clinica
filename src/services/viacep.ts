const VIACEP_BASE_URL = "https://viacep.com.br/ws";

export interface ViaCepAddress {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
}

interface ViaCepRawResponse extends Partial<ViaCepAddress> {
  erro?: boolean | "true";
}

function sanitizeCep(cep: string): string | null {
  const digits = cep.replace(/\D/g, "");
  return digits.length === 8 ? digits : null;
}

export async function fetchAddressByCep(cep: string): Promise<ViaCepAddress | null> {
  const clean = sanitizeCep(cep);
  if (!clean) return null;

  try {
    const response = await fetch(`${VIACEP_BASE_URL}/${clean}/json/`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 },
    });

    if (response.status !== 200) return null;

    const data = (await response.json()) as ViaCepRawResponse;
    if (data.erro) return null;

    return {
      cep: data.cep ?? clean,
      logradouro: data.logradouro ?? "",
      complemento: data.complemento ?? "",
      bairro: data.bairro ?? "",
      localidade: data.localidade ?? "",
      uf: data.uf ?? "",
    };
  } catch (err) {
    console.error("[ViaCEP] lookup failed:", err);
    return null;
  }
}

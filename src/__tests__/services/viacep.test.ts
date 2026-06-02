import { fetchAddressByCep } from "@/services/viacep";

const VALID_RESPONSE = {
  cep: "01310-100",
  logradouro: "Avenida Paulista",
  complemento: "",
  bairro: "Bela Vista",
  localidade: "São Paulo",
  uf: "SP",
  ibge: "3550308",
};

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

describe("fetchAddressByCep — ViaCEP integration", () => {
  it("returns parsed address for HTTP 200 valid CEP", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      json: async () => VALID_RESPONSE,
    });

    const result = await fetchAddressByCep("01310-100");

    expect(global.fetch).toHaveBeenCalledWith(
      "https://viacep.com.br/ws/01310100/json/",
      expect.objectContaining({
        headers: expect.objectContaining({ Accept: "application/json" }),
      }),
    );
    expect(result).toEqual({
      cep: "01310-100",
      logradouro: "Avenida Paulista",
      complemento: "",
      bairro: "Bela Vista",
      localidade: "São Paulo",
      uf: "SP",
    });
  });

  it("returns null when ViaCEP responds 200 with { erro: true }", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      json: async () => ({ erro: true }),
    });

    expect(await fetchAddressByCep("00000000")).toBeNull();
  });

  it("returns null on malformed CEP without calling fetch", async () => {
    expect(await fetchAddressByCep("123")).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns null on non-200 status", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 500,
      json: async () => ({}),
    });

    expect(await fetchAddressByCep("01310-100")).toBeNull();
  });

  it("returns null when fetch throws (network failure)", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("network"));
    expect(await fetchAddressByCep("01310-100")).toBeNull();
  });
});

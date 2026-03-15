import type {
  ContribuicoesResponse,
  CriarContribuicaoPayload,
} from "@/types/contribuicoes";

type ApiSuccess<T> = {
  success: true;
  data?: T;
  message?: string;
};

type ApiError = {
  success: false;
  message: string;
};

type ApiResponse<T> = ApiSuccess<T> | ApiError;

async function parseJson<T>(response: Response): Promise<ApiResponse<T>> {
  return (await response.json()) as ApiResponse<T>;
}

export async function fetchContribuicoes(userId?: string): Promise<ContribuicoesResponse> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";

  const response = await fetch(`/api/contribuicoes${query}`, {
    method: "GET",
    cache: "no-store",
  });

  const json = await parseJson<ContribuicoesResponse>(response);

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.success ? "Erro ao carregar contribuições." : json.message);
  }

  return json.data;
}

export async function criarContribuicao(payload: CriarContribuicaoPayload) {
  const response = await fetch("/api/contribuicoes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await parseJson<{ contribuicaoId: string }>(response);

  if (!response.ok || !json.success) {
    throw new Error(json.success ? "Erro ao criar contribuição." : json.message);
  }

  return json;
}
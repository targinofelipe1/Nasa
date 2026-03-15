import type {
  RecompensasResponse,
  ResgatarRecompensaPayload,
} from "@/types/recompensas";

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

export async function fetchRecompensas(userId?: string): Promise<RecompensasResponse> {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";

  const response = await fetch(`/api/recompensas${query}`, {
    method: "GET",
    cache: "no-store",
  });

  const json = await parseJson<RecompensasResponse>(response);

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.success ? "Erro ao carregar recompensas." : json.message);
  }

  return json.data;
}

export async function resgatarRecompensa(payload: ResgatarRecompensaPayload) {
  const response = await fetch("/api/recompensas", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "resgatar_recompensa",
      ...payload,
    }),
  });

  const json = await parseJson<{
    resgateId: string;
    recompensaId: string;
    coinsRestantes: number;
  }>(response);

  if (!response.ok || !json.success) {
    throw new Error(json.success ? "Erro ao resgatar recompensa." : json.message);
  }

  return json;
}
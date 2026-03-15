import type {
  ComunidadeResponse,
  CriarRelatoPayload,
  ComentarRelatoPayload,
  CurtirRelatoPayload,
} from "@/types/comunidade";

type ApiSuccess<T> = {
  success: true;
  data?: T;
  message?: string;
  relatoId?: string;
  comentarioId?: string;
  curtidaId?: string;
};

type ApiError = {
  success: false;
  message: string;
};

type ApiResponse<T> = ApiSuccess<T> | ApiError;

async function parseJson<T>(response: Response): Promise<ApiResponse<T>> {
  const json = (await response.json()) as ApiResponse<T>;
  return json;
}

export async function fetchComunidade(userId: string): Promise<ComunidadeResponse> {
  const response = await fetch(`/api/comunidade?userId=${encodeURIComponent(userId)}`, {
    method: "GET",
    cache: "no-store",
  });

  const json = await parseJson<ComunidadeResponse>(response);

  if (!response.ok || !json.success || !json.data) {
    throw new Error(json.success ? "Erro ao carregar comunidade." : json.message);
  }

  return json.data;
}

export async function criarRelato(payload: CriarRelatoPayload) {
  const response = await fetch("/api/comunidade", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "criar_relato",
      ...payload,
    }),
  });

  const json = await parseJson<never>(response);

  if (!response.ok || !json.success) {
    throw new Error(json.success ? "Erro ao criar relato." : json.message);
  }

  return json;
}

export async function comentarRelato(payload: ComentarRelatoPayload) {
  const response = await fetch("/api/comunidade", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "comentar_relato",
      ...payload,
    }),
  });

  const json = await parseJson<never>(response);

  if (!response.ok || !json.success) {
    throw new Error(json.success ? "Erro ao comentar relato." : json.message);
  }

  return json;
}

export async function curtirRelato(payload: CurtirRelatoPayload) {
  const response = await fetch("/api/comunidade", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "curtir_relato",
      ...payload,
    }),
  });

  const json = await parseJson<never>(response);

  if (!response.ok || !json.success) {
    throw new Error(json.success ? "Erro ao curtir relato." : json.message);
  }

  return json;
}
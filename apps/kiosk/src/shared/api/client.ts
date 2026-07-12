import { ApiError, type ApiErrorBody } from "@flick/api-client";
import { API_BASE_URL } from "@/shared/config/env";

type RequestOptions = {
  token?: string | null;
  method?: string;
  body?: unknown;
};

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export async function apiRequest<T>(
  path: string,
  { token, method = "GET", body }: RequestOptions = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    let data: ApiErrorBody | null = null;
    try {
      data = (await response.json()) as ApiErrorBody;
    } catch {}
    throw new ApiError(
      data?.error?.code ?? "REQUEST_ERROR",
      data?.error?.message ?? "요청을 처리할 수 없습니다",
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

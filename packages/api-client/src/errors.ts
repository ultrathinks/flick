import type { HTTPError } from "ky";

export interface ApiErrorBody {
  error: { code: string; message: string };
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const error: unknown = Reflect.get(value, "error");
  if (typeof error !== "object" || error === null) {
    return false;
  }
  return typeof Reflect.get(error, "code") === "string";
}

export async function toApiError(error: HTTPError): Promise<ApiError> {
  const { response } = error;
  const body: unknown = await response.json().catch(() => null);
  if (isApiErrorBody(body)) {
    return new ApiError(body.error.code, body.error.message, response.status);
  }
  return new ApiError(
    "UNKNOWN",
    response.statusText || "Request failed",
    response.status,
  );
}

import { type ApiError, isApiError } from "@flick/api-client";

export { ApiError, type ApiErrorBody, isApiError } from "@flick/api-client";
export { apiRequest, getApiBaseUrl } from "./client.ts";

export function isKioskRevoked(error: unknown): boolean {
  return (
    isApiError(error) && error.status === 403 && error.code === "KIOSK_REVOKED"
  );
}

export function isAuthExpired(error: unknown): error is ApiError {
  return isApiError(error) && error.status === 401;
}

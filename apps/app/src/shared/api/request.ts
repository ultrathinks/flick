import { HTTPError, type Options } from "ky";
import type { z } from "zod";
import { api } from "./client.ts";
import { ApiError, type ApiErrorBody } from "./errors.ts";

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const error: unknown = Reflect.get(value, "error");
  if (typeof error !== "object" || error === null) {
    return false;
  }
  return typeof Reflect.get(error, "code") === "string";
}

async function toApiError(error: HTTPError): Promise<ApiError> {
  const { response } = error;
  const body: unknown = await response.json().catch(() => null);
  if (isErrorBody(body)) {
    return new ApiError(body.error.code, body.error.message, response.status);
  }
  return new ApiError(
    "UNKNOWN",
    response.statusText || "Request failed",
    response.status,
  );
}

export async function request<T>(
  schema: z.ZodType<T>,
  path: string,
  options?: Options,
): Promise<T> {
  const json = await api(path, options)
    .json<unknown>()
    .catch(async (error: unknown) => {
      if (error instanceof HTTPError) {
        throw await toApiError(error);
      }
      throw error;
    });
  return schema.parse(json);
}

export async function requestVoid(
  path: string,
  options?: Options,
): Promise<void> {
  await api(path, options).catch(async (error: unknown) => {
    if (error instanceof HTTPError) {
      throw await toApiError(error);
    }
    throw error;
  });
}

import { HTTPError, type KyInstance, type Options } from "ky";
import type { z } from "zod";
import { toApiError } from "./errors.ts";

async function unwrap<T>(promise: Promise<T>): Promise<T> {
  return promise.catch(async (error: unknown) => {
    if (error instanceof HTTPError) {
      throw await toApiError(error);
    }
    throw error;
  });
}

export function createRequest(api: KyInstance) {
  async function request<T>(
    schema: z.ZodType<T>,
    path: string,
    options?: Options,
  ): Promise<T> {
    const json = await unwrap(api(path, options).json<unknown>());
    return schema.parse(json);
  }

  async function requestVoid(path: string, options?: Options): Promise<void> {
    await unwrap(api(path, options));
  }

  return { request, requestVoid };
}

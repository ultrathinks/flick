import { createRequest } from "@flick/api-client";
import { api } from "./client.ts";

export { ApiError, type ApiErrorBody, isApiError } from "@flick/api-client";
export { type AuthHooks, api, setAuthHooks } from "./client.ts";

export const { request, requestVoid } = createRequest(api);

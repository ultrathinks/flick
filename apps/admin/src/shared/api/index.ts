import { createRequest } from "@flick/api-client";
import { api } from "./client.ts";

export { ApiError, type ApiErrorBody } from "@flick/api-client";
export { api } from "./client.ts";
export const { request, requestVoid } = createRequest(api);
export { type Page, useCursorQuery } from "./cursor.ts";

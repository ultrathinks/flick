import ky, { type KyInstance } from "ky";
import { API_BASE_URL } from "@/shared/config";

export interface AuthHooks {
  getAccessToken: () => string | null;
  refresh: () => Promise<string | null>;
}

let authHooks: AuthHooks | null = null;

export function setAuthHooks(hooks: AuthHooks): void {
  authHooks = hooks;
}

export const api: KyInstance = ky.create({
  prefixUrl: API_BASE_URL,
  retry: { limit: 1, shouldRetry: () => false },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = authHooks?.getAccessToken();
        if (token) {
          request.headers.set("Authorization", `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (request, _options, response, state) => {
        if (
          response.status !== 401 ||
          !authHooks ||
          state.retryCount > 0 ||
          request.url.includes("/auth/")
        ) {
          return response;
        }
        const token = await authHooks.refresh();
        if (!token) {
          return response;
        }
        const headers = new Headers(request.headers);
        headers.set("Authorization", `Bearer ${token}`);
        return ky.retry({ request: new Request(request, { headers }) });
      },
    ],
  },
});

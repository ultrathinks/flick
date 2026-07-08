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
  retry: 0,
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
      async (request, _options, response) => {
        if (response.status !== 401 || !authHooks) {
          return response;
        }
        if (request.headers.get("x-flick-retried") === "1") {
          return response;
        }
        const token = await authHooks.refresh();
        if (!token) {
          return response;
        }
        if (request.headers.get("x-flick-no-replay") === "1") {
          return response;
        }
        request.headers.set("Authorization", `Bearer ${token}`);
        request.headers.set("x-flick-retried", "1");
        return ky(request);
      },
    ],
  },
});

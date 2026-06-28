import ky, { type KyInstance } from "ky";

export const api: KyInstance = ky.create({
  prefixUrl: "/api/proxy",
  retry: 0,
});

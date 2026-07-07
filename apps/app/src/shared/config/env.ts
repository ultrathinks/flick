const override = import.meta.env.VITE_API_URL?.trim();

export const API_BASE_URL = override ? override.replace(/\/$/, "") : "/v1";

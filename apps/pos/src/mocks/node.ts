import { setupServer } from "msw/node";
import { createHandlers } from "./handlers.ts";

const MOCK_API_BASE_URL =
  process.env.BASE_INTERNAL_API_URL ??
  process.env.BASE_API_URL ??
  "http://localhost:3000/v1";

export const server = setupServer(...createHandlers(MOCK_API_BASE_URL));

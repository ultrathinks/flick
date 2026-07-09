import { setupServer } from "msw/node";
import { createHandlers } from "./handlers.ts";

const API_BASE_URL = "http://localhost:3000/v1";

export const server = setupServer(
  ...createHandlers("/api/proxy"),
  ...createHandlers(API_BASE_URL),
);

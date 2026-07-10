import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "@/mocks/server.ts";

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

if (typeof globalThis.EventSource === "undefined") {
  class MockEventSource {
    onopen: (() => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: (() => void) | null = null;
    close(): void {}
    addEventListener(): void {}
    removeEventListener(): void {}
  }
  globalThis.EventSource = MockEventSource as unknown as typeof EventSource;
}

function absolute(url: string): string {
  return url.startsWith("/") ? new URL(url, window.location.origin).href : url;
}

const NativeRequest = globalThis.Request;

class RelativeAwareRequest extends NativeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === "string" ? absolute(input) : input, init);
  }
}

globalThis.Request = RelativeAwareRequest as typeof Request;

const nativeFetch = globalThis.fetch;

globalThis.fetch = ((input, init) =>
  nativeFetch(
    typeof input === "string" ? absolute(input) : input,
    init,
  )) as typeof fetch;

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

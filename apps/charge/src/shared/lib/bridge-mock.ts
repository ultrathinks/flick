interface BridgeRequest {
  id: string;
  timestamp: number;
  type: string;
  payload?: unknown;
}

type MockResponder = (request: BridgeRequest) => object;

const responders: Record<string, MockResponder> = {
  HAPTIC: () => ({}),
  NAVIGATION_POP: () => ({}),
  QR_SCAN: () => ({ text: "482913" }),
};

function dispatchResponse(request: BridgeRequest, data: object): void {
  const response = {
    id: request.id,
    type: request.type,
    timestamp: Date.now(),
    success: true,
    ...data,
  };
  window.dispatchEvent(
    new MessageEvent("message", { data: JSON.stringify(response) }),
  );
}

function parseRequest(message: string): BridgeRequest | null {
  let value: unknown;
  try {
    value = JSON.parse(message);
  } catch {
    return null;
  }
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const id = Reflect.get(value, "id");
  const type = Reflect.get(value, "type");
  const timestamp = Reflect.get(value, "timestamp");
  if (
    typeof id !== "string" ||
    typeof type !== "string" ||
    typeof timestamp !== "number"
  ) {
    return null;
  }
  return { id, type, timestamp, payload: Reflect.get(value, "payload") };
}

export function installBridgeMock(): void {
  if (window.ReactNativeWebView) {
    return;
  }
  window.__flickBridgeMock = true;
  window.ReactNativeWebView = {
    postMessage(message: string) {
      const request = parseRequest(message);
      if (!request) {
        return;
      }
      const responder = responders[request.type];
      if (!responder) {
        return;
      }
      const data = responder(request);
      queueMicrotask(() => dispatchResponse(request, data));
    },
  };
}

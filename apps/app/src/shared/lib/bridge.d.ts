interface ReactNativeWebViewBridge {
  postMessage(message: string): void;
}

declare global {
  interface Window {
    ReactNativeWebView?: ReactNativeWebViewBridge;
    __flickBridgeMock?: boolean;
  }
}

export {};

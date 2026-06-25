const APP_STATE_KEY = "app_state";
const ROUTER_STACK_KEY = "router-provider::stack";

export function resetRouterStack(): void {
  try {
    const raw = window.localStorage.getItem(APP_STATE_KEY);
    if (!raw) {
      return;
    }
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) {
      return;
    }
    const next = { ...parsed, [ROUTER_STACK_KEY]: [] };
    window.localStorage.setItem(APP_STATE_KEY, JSON.stringify(next));
  } catch {}
}

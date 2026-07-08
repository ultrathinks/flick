import type { CartItem, KioskSession, PaymentSnapshot } from "./types";

const KIOSK_SESSION_KEY = "flick:kiosk:session";
const CART_KEY = "flick:kiosk:cart";
const PAYMENT_KEY = "flick:kiosk:payment";
const ALERT_KEY = "flick:kiosk:alert";

const emptyPayment: PaymentSnapshot = {
  orderId: null,
  paymentId: null,
  code: null,
  expiresAt: null,
  totalAmount: 0,
  items: [],
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getKioskSession(): KioskSession {
  return readJson<KioskSession>(KIOSK_SESSION_KEY, { token: null });
}

export function setKioskToken(token: string | null) {
  writeJson<KioskSession>(KIOSK_SESSION_KEY, { token });
}

export function getCartItems() {
  return readJson<{ items: CartItem[] }>(CART_KEY, { items: [] }).items;
}

export function setCartItems(items: CartItem[]) {
  writeJson(CART_KEY, { items });
}

export function clearCartItems() {
  setCartItems([]);
}

export function getPaymentSnapshot() {
  return readJson<PaymentSnapshot>(PAYMENT_KEY, emptyPayment);
}

export function setPaymentSnapshot(snapshot: PaymentSnapshot) {
  writeJson(PAYMENT_KEY, snapshot);
}

export function clearPaymentSnapshot() {
  setPaymentSnapshot(emptyPayment);
}

export function clearKioskData() {
  setKioskToken(null);
  clearCartItems();
  clearPaymentSnapshot();
}

export function takeAlert(): string | null {
  const value = sessionStorage.getItem(ALERT_KEY);
  if (value) {
    sessionStorage.removeItem(ALERT_KEY);
  }
  return value;
}

export function setAlert(message: string) {
  sessionStorage.setItem(ALERT_KEY, message);
}

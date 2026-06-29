type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type KioskSession = {
  token: string | null;
};

type PaymentSnapshot = {
  orderId: string | null;
  paymentId: string | null;
  code: string | null;
  expiresAt: string | null;
  totalAmount: number;
  items: CartItem[];
};

const KIOSK_SESSION_KEY = "flick:kiosk:session";
const CART_KEY = "flick:kiosk:cart";
const PAYMENT_KEY = "flick:kiosk:payment";

const emptySession: KioskSession = { token: null };
const emptyPayment: PaymentSnapshot = {
  orderId: null,
  paymentId: null,
  code: null,
  expiresAt: null,
  totalAmount: 0,
  items: [],
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function getKioskSession() {
  return readJson<KioskSession>(KIOSK_SESSION_KEY, emptySession);
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

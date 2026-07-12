import { check, fail } from "k6";
import http from "k6/http";
import { Counter } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const KIOSK_TOKEN = __ENV.KIOSK_TOKEN || "";
const USER_TOKEN = __ENV.USER_TOKEN || "";
const RACE_USER_TOKEN = __ENV.RACE_USER_TOKEN || "";
const PRODUCT_ID = __ENV.PRODUCT_ID || "";
const QUANTITY = Number(__ENV.QUANTITY || "1");

const confirmSuccess = new Counter("confirm_success");
const confirmConflict = new Counter("confirm_conflict");
const doubleDebit = new Counter("double_debit_detected");

const kioskHeaders = {
  Authorization: `Bearer ${KIOSK_TOKEN}`,
  "Content-Type": "application/json",
};
const userHeaders = {
  Authorization: `Bearer ${USER_TOKEN}`,
  "Content-Type": "application/json",
};
const raceUserHeaders = {
  Authorization: `Bearer ${RACE_USER_TOKEN}`,
  "Content-Type": "application/json",
};

export const options = {
  scenarios: {
    create_and_pay: {
      executor: "ramping-vus",
      exec: "createAndPay",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 20 },
        { duration: "40s", target: 50 },
        { duration: "20s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
    double_confirm_race: {
      executor: "shared-iterations",
      exec: "raceConfirm",
      vus: 40,
      iterations: 40,
      maxDuration: "30s",
      startTime: "95s",
    },
  },
  thresholds: {
    checks: ["rate>0.99"],
    double_debit_detected: ["count==0"],
    http_req_duration: ["p(95)<2000"],
  },
};

function createOrder() {
  const res = http.post(
    `${BASE_URL}/v1/orders`,
    JSON.stringify({ items: [{ productId: PRODUCT_ID, quantity: QUANTITY }] }),
    { headers: kioskHeaders, tags: { name: "create_order" } },
  );
  check(res, { "order created (201)": (r) => r.status === 201 });
  if (res.status !== 201) {
    return null;
  }
  return res.json();
}

function requestCode(orderId) {
  const res = http.post(`${BASE_URL}/v1/orders/${orderId}/payments`, null, {
    headers: kioskHeaders,
    tags: { name: "request_payment_code" },
  });
  check(res, { "payment code issued (201)": (r) => r.status === 201 });
  if (res.status !== 201) {
    return null;
  }
  return res.json("code");
}

function confirm(code, headers) {
  return http.post(`${BASE_URL}/v1/payment-codes/${code}/confirm`, null, {
    headers,
    tags: { name: "confirm_payment" },
  });
}

function getBalance(headers) {
  const res = http.get(`${BASE_URL}/v1/users/me`, {
    headers,
    tags: { name: "get_balance" },
  });
  if (res.status !== 200) {
    return null;
  }
  return res.json("balance");
}

export function setup() {
  if (!KIOSK_TOKEN || !USER_TOKEN || !RACE_USER_TOKEN || !PRODUCT_ID) {
    fail(
      "KIOSK_TOKEN, USER_TOKEN, RACE_USER_TOKEN and PRODUCT_ID are required (see README)",
    );
  }
  const order = createOrder();
  if (!order) {
    fail("setup: could not create the shared race order");
  }
  const code = requestCode(order.id);
  if (!code) {
    fail("setup: could not mint the shared race payment code");
  }
  const balanceBefore = getBalance(raceUserHeaders);
  return {
    raceCode: code,
    raceOrderTotal: order.totalAmount,
    balanceBefore,
  };
}

export function createAndPay() {
  const order = createOrder();
  if (!order) {
    return;
  }
  const code = requestCode(order.id);
  if (!code) {
    return;
  }
  const res = confirm(code, userHeaders);
  check(res, {
    "confirm resolved (200 or 4xx, never 5xx)": (r) =>
      r.status === 200 || (r.status >= 400 && r.status < 500),
  });
  if (res.status === 200) {
    confirmSuccess.add(1);
  }
}

export function raceConfirm(data) {
  const res = confirm(data.raceCode, raceUserHeaders);
  check(res, {
    "race confirm never 5xx": (r) => r.status < 500,
  });
  if (res.status === 200) {
    confirmSuccess.add(1);
  } else if (res.status === 400 || res.status === 404) {
    confirmConflict.add(1);
  }
}

export function teardown(data) {
  const balanceAfter = getBalance(raceUserHeaders);
  if (data.balanceBefore == null || balanceAfter == null) {
    return;
  }
  const debited = data.balanceBefore - balanceAfter;
  const singleDebit = debited === data.raceOrderTotal;
  check(null, {
    "exactly one debit for the raced code (no double-debit)": () => singleDebit,
  });
  if (!singleDebit) {
    doubleDebit.add(1);
  }
}

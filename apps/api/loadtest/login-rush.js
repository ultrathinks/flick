import { check } from "k6";
import http from "k6/http";
import { Counter, Trend } from "k6/metrics";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const DODAM_TOKEN = __ENV.DODAM_TOKEN || "";

const loginOk = new Counter("login_ok");
const loginRejected = new Counter("login_rejected");
const loginServerError = new Counter("login_server_error");
const upstreamLatency = new Trend("login_latency_ms", true);

export const options = {
  scenarios: {
    login_surge: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: 30 },
        { duration: "30s", target: 100 },
        { duration: "15s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    login_server_error: ["count==0"],
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<3000"],
  },
};

export default function () {
  const res = http.post(
    `${BASE_URL}/v1/auth/app`,
    JSON.stringify({ token: DODAM_TOKEN }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { name: "auth_app" },
    },
  );

  upstreamLatency.add(res.timings.duration);
  check(res, {
    "auth never 5xx": (r) => r.status < 500,
    "auth resolved (200 session or 401 reject)": (r) =>
      r.status === 200 || r.status === 401,
  });

  if (res.status === 200) {
    loginOk.add(1);
    check(res, {
      "session has accessToken": (r) => Boolean(r.json("accessToken")),
    });
  } else if (res.status >= 500) {
    loginServerError.add(1);
  } else {
    loginRejected.add(1);
  }
}

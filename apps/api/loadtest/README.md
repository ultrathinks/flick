# k6 load tests

Load tests for the Flick API's correctness-critical, money-touching paths. The
dominant scenario is the **payment path under contention** — proving that
concurrent confirms on the same payment code produce **exactly one debit**
(no double-spend), which is the guarantee `POST /v1/payment-codes/{code}/confirm`
provides via a row-level `FOR UPDATE` lock on the payment, an idempotent replay
branch, a `FOR UPDATE` lock on the user balance, and a `status = 'pending'`
guard on the order update.

These scripts are **not run in CI** — they need a seeded, migrated backend and
real bearer tokens. They are the deliverable for the go-live load-test step.
Run them against a local API while watching traces in Grafana (see
`../observability/README.md`) to spot lock-wait and pg-pool-connect bottlenecks.

## Install k6

```sh
# macOS
brew install k6
# Debian/Ubuntu
sudo apt-get install k6
# or: https://grafana.com/docs/k6/latest/set-up/install-k6/
```

## Scripts

- `payment-confirm.js` — the key test. Two scenarios:
  - `create_and_pay` (ramping VUs 0→50): each VU creates an order, requests a
    payment code, and confirms it — steady-state throughput/latency of the whole
    kiosk→user payment flow under concurrency.
  - `double_confirm_race` (40 VUs, shared iterations): `setup()` mints **one**
    order + **one** payment code, then all VUs hammer confirm on that **same
    code** simultaneously. `teardown()` reads the user balance before/after and
    asserts the debit equals exactly one order total. The `double_debit_detected`
    threshold is `count==0`, so any second debit fails the run.
- `login-rush.js` — ramps concurrent `POST /v1/auth/app` (0→100 VUs) to observe
  the login path (rate limiting removed on this route) and its synchronous Dodam
  OAuth dependency under a surge. Fails on any 5xx.

## Seeding the required tokens

Point everything at a locally running, **migrated** API (`pnpm --filter api dev`
with a real `DATABASE_URL`). Base URL defaults to `http://localhost:3000`.

### `USER_TOKEN` / `DODAM_TOKEN` (user session)

`POST /v1/auth/app` exchanges a Dodam app token for a Flick session:

```sh
curl -s -X POST "$BASE_URL/v1/auth/app" \
  -H 'Content-Type: application/json' \
  -d '{"token":"<DODAM_APP_TOKEN>"}'
# -> { "accessToken": "...", "refreshToken": "..." }
```

- `DODAM_TOKEN` for `login-rush.js` **is** that `<DODAM_APP_TOKEN>` (a valid
  Dodam-issued app token; the endpoint calls Dodam on every hit).
- `USER_TOKEN` for `payment-confirm.js` is the `accessToken` returned above.
  Fund this user's balance (via an admin charge, `POST /v1/charges`, or a seed)
  to at least one order total so confirms can succeed.

### `KIOSK_TOKEN` (kiosk device token)

Kiosks authenticate with a device token minted by pairing:

1. A booth owner creates a pairing code for their (approved) booth — the
   kiosk-pairing route returns a short `code`.
2. Redeem it:

```sh
curl -s -X POST "$BASE_URL/v1/kiosks/pair" \
  -H 'Content-Type: application/json' \
  -d '{"code":"<PAIRING_CODE>"}'
# -> { "kiosk": {...}, "deviceToken": "..." }
```

Use the returned `deviceToken` as `KIOSK_TOKEN`.

### `PRODUCT_ID`

Any available product (`status = "available"`) belonging to the **same booth**
as the paired kiosk. Grab its `id` from `GET /v1/booths/{id}/products` or your
seed. Leave the product's `stock` null (unlimited) or high enough that the load
run does not exhaust it.

## Run

```sh
export BASE_URL=http://localhost:3000

# Payment path under contention (double-debit proof):
k6 run \
  -e BASE_URL=$BASE_URL \
  -e KIOSK_TOKEN=<kiosk-device-token> \
  -e USER_TOKEN=<user-access-token> \
  -e PRODUCT_ID=<available-product-uuid> \
  loadtest/payment-confirm.js

# Login surge:
k6 run \
  -e BASE_URL=$BASE_URL \
  -e DODAM_TOKEN=<dodam-app-token> \
  loadtest/login-rush.js
```

Optional: `-e QUANTITY=2` on `payment-confirm.js` to change per-order quantity.

## Reading the results

- **Pass = no double-debit:** the `double_debit_detected` counter stays `0` and
  the `checks` rate stays `> 0.99`. In the race scenario, exactly one confirm
  should perform the debit; the rest return `200` (idempotent replay) or a
  `4xx` conflict — never a second balance decrement, never a `5xx`.
- **Bottlenecks:** with the API exporting to the local LGTM stack
  (`OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318`), open Grafana → Explore →
  Tempo and inspect the slow `confirm_payment` spans. The child `pg` query spans
  and `pg-pool.connect` span reveal whether time is spent waiting on the row
  lock (`FOR UPDATE`) or waiting for a free pooled connection under load.

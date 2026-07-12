import { createHash, randomBytes } from "node:crypto";
import pg from "pg";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(32).toString("base64url");
const rid = () => randomBytes(6).toString("hex");

const client = new pg.Client({
  connectionString:
    process.env.DATABASE_URL ?? "postgresql://flick:flick@localhost:5432/flick",
});
await client.connect();

const future = new Date(Date.now() + 24 * 60 * 60 * 1000);

async function makeBuyer(label) {
  const buyer = (
    await client.query(
      `insert into users (dauth_public_id, code, username, name, roles, balance)
       values ($1, $2, $3, $4, $5, 1000000000) returning id`,
      [
        `lt-${label}-${rid()}`,
        rid().slice(0, 6),
        `loadtest-${label}`,
        `Loadtest ${label}`,
        [],
      ],
    )
  ).rows[0];
  await client.query(
    `insert into transactions (user_id, amount, type) values ($1, 1000000000, 'adjustment')`,
    [buyer.id],
  );
  const accessToken = token();
  await client.query(
    `insert into sessions (user_id, access_token_hash, refresh_token_hash, access_token_expires_at, refresh_token_expires_at)
     values ($1, $2, $3, $4, $4)`,
    [buyer.id, hash(accessToken), hash(token()), future],
  );
  return accessToken;
}

const owner = (
  await client.query(
    `insert into users (dauth_public_id, code, username, name, roles, is_admin, balance)
     values ($1, $2, $3, $4, $5, true, 0) returning id`,
    [
      `lt-owner-${rid()}`,
      rid().slice(0, 6),
      "loadtest-owner",
      "Loadtest Owner",
      ["owner"],
    ],
  )
).rows[0];

const booth = (
  await client.query(
    `insert into booths (owner_id, name, status) values ($1, $2, 'approved') returning id`,
    [owner.id, "Loadtest Booth"],
  )
).rows[0];

const product = (
  await client.query(
    `insert into products (booth_id, name, price, stock, status)
     values ($1, $2, 100, null, 'available') returning id`,
    [booth.id, "Loadtest Product"],
  )
).rows[0];

const kioskToken = token();
await client.query(
  `insert into kiosks (booth_id, name, token_hash) values ($1, $2, $3)`,
  [booth.id, "Loadtest Kiosk", hash(kioskToken)],
);

const userToken = await makeBuyer("buyer");
const raceToken = await makeBuyer("racebuyer");

await client.end();

console.log(
  JSON.stringify(
    {
      KIOSK_TOKEN: kioskToken,
      USER_TOKEN: userToken,
      RACE_USER_TOKEN: raceToken,
      PRODUCT_ID: product.id,
      BOOTH_ID: booth.id,
    },
    null,
    2,
  ),
);

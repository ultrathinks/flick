# Bank logos

Drop each bank's official logo here as `<code>.svg` (or `.png`), where `<code>`
matches `BANKS[].code` in `src/entities/payout/lib/bank.ts`
(e.g. `toss.svg`, `kakao.svg`, `kb.svg`).

These are each bank's trademarked CI assets and are intentionally not bundled.
When a file is missing, `BankLogo` falls back to a brand-color initial badge.

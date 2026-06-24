---
name: commit
description: Create clean atomic commits in the flick monorepo, optionally push, open a PR, or merge it after CI. Use for requests like commit, push, pr, merge, ship, or land.
---

# Commit

Create clean atomic commits in the flick monorepo. Optionally push the branch, open one pull request, and merge that PR after CI passes.

All rules for the full workflow are inlined below. If you skip a rule, you have violated the skill.

## Mode selection

Pick exactly one mode from the user's natural-language request.

- **commit-only** — default. No push/PR/merge intent in the message.
- **commit + push** — the user asked to push ("push it", "send to origin").
- **commit + push + pr** — the user asked to open a PR. PR mode always implies push.
- **commit + push + pr + merge** — the user asked to open-and-merge / ship / land. Merge mode always implies pr (and therefore push).

A bare "merge" means "open a PR and merge it" — there is no path to merge an existing PR without committing. If the request is ambiguous, choose commit-only and report which steps were skipped.

## flick context

- **pnpm only** (Node 24). Never npm or yarn. **Biome**, not ESLint/Prettier. Turborepo.
- Lint: `pnpm lint` (`biome check .`) — must pass before pushing.
- Type/build check: `pnpm build`. There is no test script.
- Biome does not check Markdown, so this skill file needs no lint pass itself.
- Default branch is `main`; PRs land via **merge commit**.

## Operating rules (all modes)

- Treat `AGENTS.md`, `CLAUDE.md`, and explicit user instructions as higher priority than this skill.
- Never commit secrets, `.env*`, local state, build artifacts, or unrelated files.
- Do not use `git add .`, `git add -A`, or `git add --all`; stage explicit paths or hunks.
- Keep commits independently reviewable and revertable.
- No `Co-Authored-By` or assistant attribution trailers unless the user explicitly asks.
- Empty working tree → stop and report. Never pass `--allow-empty` unless the user requested it.
- A merge, rebase, cherry-pick, or bisect in progress → stop and report.
- `git diff HEAD` containing conflict markers (`<<<<<<< `, `=======`, `>>>>>>> `) → stop and report.

## Workflow

### Phase 1 — Ground state (always)

1. `git status --short --branch`
2. `git diff --stat HEAD`
3. `git diff HEAD`
4. `git log --oneline -10`
5. Commit message format: follow active repo guidance (`AGENTS.md` / `CLAUDE.md` / commit config), else recent local style if consistent, else the **Commit message rules** below. flick's history already uses `type: description` lowercase (feat/fix/chore/docs), which matches those rules.
6. Default branch: `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`, falling back to `main`.
7. If on the default branch AND any push/PR mode is active, create `<prefix>/<short-change-slug>` and switch to it before committing. `<prefix>` reflects the whole branch's net purpose, not any single commit:
   - `feature/` — new functionality (even with small fixes along the way).
   - `fix/` — primarily fixing a bug or regression.
   - `chore/` — everything else: deps, build/CI, config, docs, refactors with no behavior change, tests-only.

   `<short-change-slug>` is lowercase kebab-case, under 40 chars. Examples: `feature/login-endpoint`, `fix/telegram-timeout`, `chore/bump-tokio`. Pick the prefix once at branch creation; do not rename mid-branch.

### Phase 2 — Plan atomic commits (always)

8. List every changed file with a one-line summary.
9. Group hunks by **reason to exist**, not by file boundary. Same-reason hunks across files belong together; different-reason hunks in one file belong apart. Mark any file needing a split as `split:<file>`.
10. Output the plan as a numbered list before any commit. Each line: `<n>. <type>: <description> — <files-or-hunks>`.
11. For every `split:` file, use `git add -p` (`s` to split, `e` to manually edit adjacent hunks). Never fall back to `git add <path>` on a split file.
12. If `git diff HEAD --submodule=short` shows submodule pointer changes, give each its own commit unit.

### Phase 3 — Execute commits (always)

13. For each planned commit in dependency order: stage only its files/hunks, review with `git diff --cached --stat` and `git diff --cached`, then commit with the planned message.
14. **Pre-commit hook retry.** If a hook fails and rewrote staged files, re-stage and retry the commit ONCE. A second failure → stop and report. Never pass `--no-verify` unless the user requested it.
15. After all commits: `git status --short --branch` and `git log --oneline -n <new-commit-count+3>` as evidence.

### Phase 4 — Push (push, pr, or merge mode)

16. Apply the **Push rules** below.

### Phase 5 — Pull request (pr or merge mode)

17. Apply the **Pull request rules** below.

### Phase 6 — Merge (merge mode)

18. Apply the **Merge rules** below. Never run `git checkout` or `git pull` ourselves — `gh pr merge --delete-branch` may switch branches during cleanup, and that is fine.

## Commit message rules

Use when no stronger convention is set by repo guidance, the user, or local history.

### Format

```
type: description
```

### Types

`feat` (new feature), `fix` (bug fix), `chore` (maintenance/deps/config), `refactor` (no behavior change), `docs`, `test`, `perf`.

### Rules

- English lowercase only. No uppercase anywhere. No scope, no trailing period.
- Single line only — no body or extended description.
- Concise: capture the core change, nothing extra.
- No `Co-Authored-By` or assistant attribution.

### Granularity

**One commit, one reason to exist** — not one file, not one function. A refactor and a bug fix are two reasons even on the same line. A function extraction plus all its call-site updates are one reason even across ten files. Default to the smallest reviewable unit; when in doubt, split.

- Same type, different reason = separate commits.
- **Hunk-level splitting is the default.** Any file whose hunks serve more than one reason requires `git add -p`. Use `s` to split; if it refuses on adjacent lines, use `e` to keep only the right lines.
- Same-reason hunks across files = one commit.
- Tests commit alongside the code they test, not as one "add tests" commit.
- Config/dependency changes commit separately from the code that uses them.
- Pure formatting / whitespace / import-reorder goes in its own commit, never mixed with behavior — one stray reformatted line forces a split.
- Pure renames/moves get their own commit so the rename is visible.
- **Each commit should build / parse on its own.** Where hunk-level splitting would produce a commit that does not build, prefer the larger atomic unit that does — buildability beats granularity.
- If a single hunk genuinely fixes a bug and adds a feature inseparably, commit it once and note the entanglement in the message. Do not invent a fake split.

## Push rules

Apply when push mode is active.

### Prerequisites

All Phase 3 commits succeeded, working tree clean, no merge/rebase/cherry-pick/bisect in progress.

### Pre-push verification

Run `pnpm lint` (must pass) and `pnpm build` (type/build check). flick has no test script. Skip only if the user explicitly asked for commit-only speed.

If verification fails, stop. Do not push. Report the failing command and the minimal next action.

### Branch protection

Never push directly to `main`, `master`, `develop`, or `release/*`. Phase 1 step 7 should have moved off the default branch already; if you are still on a protected branch, stop and require explicit user confirmation.

### Force policy

- Never `git push --force`.
- Use `--force-with-lease` ONLY if the user explicitly authorized a force update this turn. Before it, run `git fetch origin <branch>` so the lease check is meaningful.

### Standard push

- Detect upstream: `git rev-parse --abbrev-ref --symbolic-full-name @{u}` (exit 0 = upstream set).
- First push: `git push -u origin <current-branch>`. Subsequent: `git push`.
- Non-fast-forward rejection with no force authorization → stop and report. Do not retry with force.

### Output

One line: `pushed <n> commit(s) to origin/<branch>`.

## Pull request rules

Apply when pr mode is active, after push succeeds.

### gh availability

Check `gh auth status` once. If `gh` is missing or unauthenticated: do NOT undo the push, print the compare URL `https://github.com/<owner>/<repo>/compare/<base>...<head>?expand=1`, report `gh unavailable — open the URL above to create the PR manually`, and exit cleanly.

### Existing PR

```
gh pr list --head <current-branch> --state open --json number,url --jq '.[0]'
```

If a PR is returned, do NOT create a new one — the push already updated it. Report `existing PR updated: <url>` and proceed to reporting. Only create when none exists.

### Base branch

Use the user's specified base if given, else resolve via `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`, falling back to `main`.

### Template

If `.github/PULL_REQUEST_TEMPLATE.md` or `.github/pull_request_template.md` exists, use its structure and fill it from commit history and verification results. Otherwise use the bundled template below. Do not override an existing template.

### Bundled PR body template

```markdown
## Summary
<one or two sentences explaining why this PR exists>

## Verification
- `pnpm lint` — passed
- `pnpm build` — passed
```

If a verification command could not run, state the reason under `## Verification` rather than omitting it.

### Title

One logical change → reuse the first commit's subject. Otherwise summarize the branch's net intent. Lowercase, no trailing period, under 70 chars.

### Draft policy

Default non-draft. Use `--draft` ONLY when the user asked for a draft OR pre-push verification was skipped.

### Command

```
gh pr create \
  --base <base> \
  --head <current-branch> \
  --title "<title>" \
  --body "$(cat <<'PR_BODY'
...body content...
PR_BODY
)"
```

Do not pass `--reviewer`, `--label`, `--milestone`, or `--assignee` unless the user specified them.

### Reporting

Two lines:

1. `PR opened: <url>` (or `existing PR updated: <url>`)
2. Initial CI status from `gh pr checks <number> --json state,name` — e.g. `checks: 3 queued`, `checks: pending`, `checks: passing`. On query failure, `checks: unknown`.

## Merge rules

Apply when merge mode is active, after the PR phase succeeds.

### Prerequisites

A PR number/URL is known for the current branch, `gh` is authenticated, and the current branch is not the default.

### Draft check

If `gh pr view <number> --json isDraft --jq .isDraft` is `true`, stop: `merge blocked: PR is a draft — mark it ready first (gh pr ready <number>)`.

### CI wait

```
gh pr checks <number> --watch --fail-fast
```

- Exit 0 → all required checks passed; proceed.
- Non-zero → stop: `merge blocked: ci failed — see <pr-url>/checks`. Do not retry, do not bypass.
- If `--watch` is unsupported, fall back to one `gh pr checks <number> --required` snapshot; proceed only if every required check shows `pass`.

**Never bypass CI.** Never pass `--admin` or any bypass flag. Only exception: the user explicitly requested bypass this turn ("force merge", "merge with admin") — even then, confirm the PR URL and ask once first. Stopping before merge is a safe outcome, not a failure.

### Merge strategy

flick lands PRs via **merge commit** (`--merge`), preserving every atomic commit. Selection order:

1. User-specified strategy this turn (`squash`/`rebase`/`merge`) wins.
2. Else check `gh repo view --json mergeCommitAllowed,squashMergeAllowed,rebaseMergeAllowed`.
3. Prefer `--merge`; fall back to `--rebase`, then `--squash`, only if it is the sole allowed option. If none are allowed, stop and report.

### Merge queue

If the merge command output contains `added to the merge queue` / `merge queue`, report `queued: <pr-url>` and treat as success — do not wait or retry. Never use `--auto`; we do synchronous CI-wait + immediate merge ourselves.

### Branch deletion

Pass `--delete-branch` by default (deletes remote and local). `gh pr merge --delete-branch` switches off the merging branch as cleanup — do not run `git checkout`/`git pull` on top.

Skip `--delete-branch` only when:
- The user asked to keep the branch, OR
- The checkout is a `git worktree` (`[ "$(git rev-parse --git-common-dir)" != "$(git rev-parse --git-dir)" ]`) — then omit it, merge, run `git push origin --delete <branch>` separately, and report local cleanup as a suggestion, OR
- The local branch has uncommitted changes (`git status --short` non-empty) — stop before merge and report.

### Command

```
gh pr merge <number> --merge --delete-branch
```

Substitute the strategy flag and omit `--delete-branch` per the rules above.

### Reporting

Up to three lines:

1. `merged: <pr-url> via <strategy>` (or `queued: <pr-url>`)
2. `branch deleted: <branch-name>` (omit if skipped; on partial failure, `branch deleted: remote only` / `local only` with the error)
3. `suggested cleanup: <command>` — only if real local cleanup remains (e.g. worktree case).

## Output expectations

- Phase 2 plan is visible before any commit happens.
- Each phase ends with one terse status line. No prose recap of diffs.
- On any stop condition, report the exact reason and the minimal next action.
- In merge mode, the final output is the post-merge lines. Do not summarize the whole workflow afterward.

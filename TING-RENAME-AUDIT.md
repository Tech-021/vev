# TING rename audit

Audit of every remaining reference to **VEV / vev / vev.no / join-vev.no** in the
repository and on the deployment host, with a recommended disposition for each.

- **Date:** 2026-09-09
- **Branch:** `main` @ `aad1c42`
- **Scope:** working tree of `/var/www/vev`, plus deployment surfaces on this host
  (systemd, nginx, git remote, Supabase). `node_modules/`, `.next/`, and
  `.git/` object history were scanned but are treated as generated / immutable.
- **Prior work:** commit `6fe0e9d` ("Rename public brand VEV → TING, domain
  vev.no → join-ting.no") already converted the user-facing brand strings,
  metadata, the wordmark, the invitation email, and all `vev.no/<slug>` UI hints
  (now routed through `PUBLIC_HOST` in `lib/brand.ts`). This audit covers what
  that commit deliberately or accidentally left behind.

**This document changes nothing.** No source, config, migration, database, git
history, or deployment file was modified.

---

## Category legend

| # | Category | Meaning |
|---|----------|---------|
| 1 | User-facing brand/content | A person using the product sees this. → becomes **TING** |
| 2 | Public domain | A public hostname/URL. → becomes **join-ting.no** |
| 3 | Internal technical identifier | Package name, unix user, port, project id, path slug. Not visible to end users. → **leave unchanged for now** |
| 4 | Documentation / comments | Prose in code comments, README, ops files. → **update** (low risk) |
| 5 | Dangerous / high-risk | Changing it breaks checksums, history, ownership, or running infra. → **do not change automatically** |

---

## Executive summary

- **User-facing brand strings: fully converted.** A case-sensitive sweep for
  `VEV` / `Vev` across `app/`, `components/`, and `lib/` returns **zero** hits.
  Every screen, the `<title>` metadata, the invitation email, and the portal
  URL hints now read TING / `join-ting.no`.
- **What remains is entirely internal or ops-facing:** the npm package name,
  the local Supabase `project_id`, the `.vev-dev-mail/` dev path, the demo
  password default string, historical migration comments, the systemd unit, and
  the GitHub remote.
- **Two real deployment gaps** (not "references", but blockers for the rename to
  be visible publicly): there is **no nginx vhost** for `join-ting.no`, and
  **`NEXT_PUBLIC_SITE_URL` is unset**, so invitation-email links would not point
  at `join-ting.no` in production.
- **Highest-risk items to leave alone:** applied migration files (checksums),
  git commit-author history, and the `vev` unix user / `/var/www/vev` path.

---

## Findings

### A. Repository — application & config

#### A1. `package.json:2` — npm package name
```json
"name": "vev",
```
- **Category:** 3 (internal identifier)
- **Recommendation:** **Leave unchanged for now.** The package is `"private": true`
  and never published, so the name is cosmetic. If the team wants it renamed to
  `ting` for tidiness, do it together with A2 and regenerate the lockfile with
  `npm install` (never hand-edit the lockfile). Not urgent; pure churn.

#### A2. `package-lock.json:2` and `package-lock.json:8` — mirror of package name
```json
"name": "vev",
```
- **Category:** 3 (internal identifier)
- **Recommendation:** **Leave unchanged.** Only changes as a side effect of A1,
  via `npm install`. Do not hand-edit.
- **Note — false positive at `package-lock.json:960`:** the string
  `sha512-bxveV4V8v5Yb4ncFTT3rPSgZBOpCkjfK0y4oVVVJwIuDVBRMDXrPyXRL988i5ap9m9bnyEEjWfm5WkBmtffLfA==`
  contains the substring `veV` inside a base64 integrity hash. **Not a brand
  reference.** Ignore.

#### A3. `.env.example:17` — demo password default
```
DEMO_ACCOUNT_PASSWORD=vev-demo-passord
```
- **Category:** 4 (documentation) / 3 (internal)
- **Context:** local-development-only value; the file comment says "Leave unset
  anywhere real." Paired with A4 (`scripts/seed.ts:27`), which uses the same
  literal as its fallback.
- **Recommendation:** **Optional** cosmetic change to `ting-demo-passord`. If
  changed, change A3 **and** A4 in the same commit. Side effect: the next
  `npm run seed` run re-keys the seeded demo accounts to the new password
  (harmless — seed is idempotent and updates existing users). Not
  security-sensitive (demo login is gated behind `NEXT_PUBLIC_ENABLE_DEMO_LOGIN`).

#### A4. `scripts/seed.ts:27` — demo password fallback literal
```ts
const DEMO_PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD ?? "vev-demo-passord";
```
- **Category:** 4 / 3
- **Recommendation:** Same as A3 — change only in lockstep with `.env.example:17`,
  or leave both. No functional impact when `DEMO_ACCOUNT_PASSWORD` is set in env.

#### A5. `.gitignore:51` — dev mail capture directory
```
.vev-dev-mail/
```
- **Category:** 3 (internal path)
- **Context:** names the folder the file-based email provider writes to in local
  dev. Paired with A6 (three occurrences in `lib/email/provider.ts`).
- **Recommendation:** **Leave unchanged for now** (matches the prior commit's
  stated decision). If renamed to `.ting-dev-mail/`, all four locations
  (`.gitignore:51`, `lib/email/provider.ts:29`, `:42`, `:57`) must change
  together. Not user-facing — the path appears only on local disk and in a dev
  console line. Low priority.

#### A6. `lib/email/provider.ts:29`, `:42`, `:57` — dev mail path
```ts
// :29  * Development provider: writes each message to `.vev-dev-mail/` and logs where
// :42    const dir = join(process.cwd(), ".vev-dev-mail");
// :57    console.info(`[e-post] Skrev til .vev-dev-mail/${id}.html — «${message.subject}» til ${message.to}`);
```
- **Category:** 3 (`:42` is the functional path) / 4 (`:29` comment, `:57` log line)
- **Recommendation:** **Leave unchanged for now.** If changed, change all three
  here + `.gitignore:51` (A5) in one commit. The console string at `:57` is
  developer-facing only (never shown to an end user). No production impact —
  `FileEmailProvider` is not used when a real `EMAIL_PROVIDER` is configured.

#### A7. `.claude/launch.json:5` — editor launch config name
```json
"name": "vev",
```
- **Category:** 4 (local tooling) / 3
- **Recommendation:** **Optional** — safe to change the label to `ting` / `TING`;
  affects only the local run/debug menu. No runtime effect. (Unrelated aside:
  `port` here is `3000`, while the systemd unit runs on `3010` — not a brand
  issue, noted only so nobody "fixes" one to match the other during the rename.)

#### A8. `supabase/config.toml:5` — local Supabase project id
```toml
project_id = "vev"
```
- **Category:** 3 (internal identifier)
- **Context:** distinguishes local `supabase` CLI projects / Docker container
  names on a developer's machine. Independent of the linked hosted project
  (which is addressed by `--project-ref`). Not shipped, not user-visible.
- **Recommendation:** **Leave unchanged for now.** Renaming forces every
  developer to `supabase stop --project-id vev` and re-init their local stack,
  for no functional gain. Revisit only if the repo is renamed wholesale.

#### A9. `lib/brand.ts:12` — public host constant — ✅ ALREADY DONE
```ts
export const PUBLIC_HOST = "join-ting.no";
```
- **Category:** 2 (public domain)
- **Status:** **Complete.** This is now the single source of truth for the
  public domain; every UI "type this in your address bar" hint interpolates it.
  No action. Listed here so the audit is exhaustive.

#### A10. `.env.example:10` — site URL comment — ✅ ALREADY DONE
```
# Set this in production to the public site, e.g. https://join-ting.no.
```
- **Category:** 2 / 4
- **Status:** **Complete.** No action. See F2 for the matching production
  environment gap.

---

### B. Repository — database migrations (applied history)

All five files below are **already-applied migrations**. Editing an applied
migration changes its checksum; `supabase db push` / `supabase migration repair`
and every teammate's local `supabase db reset` will then complain or diverge.

> **Blanket recommendation for B1–B4: do not edit these files.** They are a
> historical record. If a written trace of the rename is wanted, add it to the
> README or a new migration's header comment — never by rewriting old ones.
> **Category 5** (dangerous to change automatically), falling back to **3**.

#### B1. `supabase/migrations/20260906120000_init.sql:1`
```sql
-- Vev — initial schema.
```
- Comment only. Leave.

#### B2. `supabase/migrations/20260906120100_rpc.sql:1`
```sql
-- Vev — the only two ways in, and the membership state machine.
```
- Comment only. Leave.

#### B3. `supabase/migrations/20260908140000_access_requests_invitations.sql:4` and `:7`
```sql
-- :4  -- which meant only someone who already had a VEV account could ask to join,
-- :7  -- of the *organisation* who has never heard of VEV, and being approved should
```
- Comment only. Leave.

#### B4. `supabase/migrations/20260908150000_access_request_functions.sql:17`
```sql
-- learn whether an address has a VEV account, is already a member, or has
```
- Comment only. Leave. (The privacy behaviour it describes is still correct.)

#### B5. Database identifiers — **checked, nothing to rename**
- Storage bucket id: `community-emoji` (`20260908130000_emoji_storage.sql:16,33,41,47`) — no "vev".
- Schema: `public`. No `create schema vev`, no `create role vev`.
- No table, column, function, policy, or trigger name contains "vev".
- `supabase/config.toml` storage/auth blocks: no "vev".
- **Conclusion:** the database contains **no** VEV-derived identifiers. Nothing
  to change here even in principle.

#### B6. False positive — `skrivevei`
- `supabase/migrations/20260908110000_comments_and_reactions.sql:266`
- `supabase/migrations/20260908100000_posts_write.sql:77`
```sql
raise exception 'Kommentarer og reaksjoner har sin egen skrivevei'
```
- The substring `vev` appears inside the Norwegian word **`skrivevei`**
  ("write path"). **Not a brand reference.** Do not touch. Flagged so future
  greps don't re-raise it.

---

### C. Deployment host — systemd

**File:** `/etc/systemd/system/vev.service`
(enabled via `/etc/systemd/system/multi-user.target.wants/vev.service` symlink)

> Deployment file — **do not edit as part of an automated pass.** Any change
> here needs `systemctl daemon-reload` and a service restart, and should be done
> deliberately by whoever operates the host. Recommendations below are for that
> person.

| Line | Current | Category | Recommendation |
|------|---------|----------|----------------|
| `Description=VEV community platform (Next.js)` | operator-facing string in `systemctl status` | 4 / 1 | Update to `TING community platform (Next.js)` |
| `Documentation=https://vev.no` | 2 (public domain) | 2 | Change to `https://join-ting.no`. `vev.no` may no longer be under the project's control — a stale link here is a minor info-leak / support-confusion risk. |
| `User=vev`, `Group=vev` | 3 → 5 | **Do not change.** Renaming a unix account rewrites file ownership across `/var/www/vev`, the home dir, and any `sudoers`/cron entries. Out of proportion to a branding pass. |
| `WorkingDirectory=/var/www/vev`, `ExecStart=/usr/bin/node /var/www/vev/node_modules/next/dist/bin/next start …`, `ReadWritePaths=/var/www/vev/.next` | 3 → 5 | **Do not change.** The deploy path is wired into systemd, nginx, the git checkout, and this audit's own assumptions. Move it only as a planned migration, not a rename. |
| `Environment=PORT=3010`, `-p 3010`, `-H 127.0.0.1` | 3 (internal port) | **Leave.** Loopback-only; not brand-related. |
| unit filename `vev.service` | 3 → 5 | **Leave for now.** Renaming needs `systemctl disable --now vev` + new unit + re-enable, and a matching change wherever monitoring/alerting references the unit name. |

**Net actionable systemd change (manual, low-risk):** the `Description=` and
`Documentation=` lines only.

---

### D. Deployment host — nginx

**Checked:** `/etc/nginx/nginx.conf`, `/etc/nginx/sites-available/{default,sirik.no,undertherug.no}`,
`/etc/nginx/sites-enabled/`.

- **No reference to `vev`, `vev.no`, `join-ting.no`, or port `3010` exists in any
  nginx config.** Nothing to rename.
- **Deployment gap (not a rename item, but blocks the public brand):** there is
  **no server block for `join-ting.no`** (nor one for the old `vev.no`). The
  running app on `127.0.0.1:3010` is not exposed by any vhost. For
  `https://join-ting.no/<slug>` to work, someone must add a vhost proxying to
  `127.0.0.1:3010` and obtain a cert (`certbot --nginx -d join-ting.no`).
  `/etc/letsencrypt/live/` currently has no `join-ting.no` cert.
- **Do not touch** the existing `undertherug.no` vhost — it proxies to
  `127.0.0.1:3000`, a *different* app, and `undertherug.no` is one of the
  fictional demo communities, not the platform.

See **F1** for the follow-up.

---

### E. Deployment host — git & GitHub

#### E1. `.git/config` — remote URL
```ini
url = git@github.com:c0n4w0w/vev.git
```
- **Category:** 3 (internal identifier)
- **Recommendation:** **Leave / coordinate manually.** Renaming the GitHub repo
  to `ting` is a deliberate infra action (GitHub keeps redirects for the old
  name, so it's low-risk *if* done consciously). If the repo is renamed, update
  this line to match, plus any CI/deploy webhooks. Not an automatic change.

#### E2. Commit-author identity in history
- Every commit in `6fe0e9d`'s lineage is authored by
  `VEV <vev@admin.undertherug.no>` (alongside `Omar Nawaz <…>`).
- **Category:** 5 (dangerous — history rewrite)
- **Recommendation:** **Do not change.** Rewriting author history on a shared
  branch is destructive and explicitly out of scope. For *future* commits, note
  that this repo has **no local `user.name` / `user.email`** set — configure the
  desired identity (`git config user.email …`) before the next commit if the
  `VEV` author string should stop appearing.

---

### F. Follow-ups that are not "references" but are required for the rename

#### F1. Public vhost + TLS for `join-ting.no` — **missing**
- No nginx server block and no Let's Encrypt cert for `join-ting.no`.
- Owner action: add a vhost proxying `join-ting.no` (and `www.`) →
  `127.0.0.1:3010`, then `certbot`. Until then the rebrand is invisible to the
  public internet.

#### F2. `NEXT_PUBLIC_SITE_URL` — **unset in production**
- `.env.local` on this host does **not** define `NEXT_PUBLIC_SITE_URL`.
- `app/actions.ts:417-419` builds invitation-accept links from this var, falling
  back to the inbound request's `host` header. Without it, and with F1 unresolved,
  invitation emails would carry `http://127.0.0.1:3010/...` or a wrong host.
- Owner action: set `NEXT_PUBLIC_SITE_URL=https://join-ting.no` in the production
  environment once F1 is live.

#### F3. Hosted Supabase Auth configuration — **verify in dashboard**
- `NEXT_PUBLIC_SUPABASE_URL` (`https://opiuncmxlobwuhghuzgj.supabase.co`) is an
  opaque ref — no "vev" in it, nothing to rename.
- However, the hosted project's **Auth → URL Configuration** (Site URL and
  Redirect URLs) lives in the Supabase dashboard, not this repo. If it still
  points at `vev.no` / `localhost`, magic-link and OAuth redirects for
  `join-ting.no` will fail. `supabase/config.toml:158,164` only covers *local*
  dev (`localhost:3000`) and is correct as-is.
- The hosted project's **display name** in the dashboard may also still read
  "vev" — cosmetic, operator's call.

#### F4. Optional: local Supabase project id (A8) and npm name (A1)
- Grouped here as "do together or not at all" — a wholesale repo/dir/identifier
  rename is a separate, planned piece of work, not part of the brand pass.

---

## Coordinated-change groups

If any of the "optional" internal renames are done, these sets must move together
in a single commit to avoid a broken tree:

1. **Demo password:** `.env.example:17` + `scripts/seed.ts:27`
2. **Dev mail path:** `.gitignore:51` + `lib/email/provider.ts:29` + `:42` + `:57`
3. **npm package name:** `package.json:2` → then `npm install` regenerates
   `package-lock.json` (do not hand-edit)
4. **Repo-wide identifier rename** (only as planned work): `supabase/config.toml:5`
   `project_id`, GitHub repo + `.git/config`, `/var/www/vev` path, `vev` unix
   user, `vev.service` unit name.

---

## Verification — already converted by commit `6fe0e9d` (no action needed)

A case-sensitive search for `VEV` / `Vev` in `app/`, `components/`, `lib/` now
returns nothing. Confirmed done:

| Area | File(s) | What changed |
|------|---------|--------------|
| Root metadata | `app/layout.tsx:19-24` | `title.default`, `title.template` (`%s · TING`), `description` |
| Wordmark | `components/shell/Wordmark.tsx` | dropped the woven-square "vev = weave" glyph; plain `TING` wordmark; comment updated |
| App shell | `components/shell/AppShell.tsx:191,335`, `components/shell/CommunitySwitcher.tsx:95` | sidebar empty-state, mobile header wordmark, "Tilbake til TING" |
| Landing | `app/page.tsx` | hero copy, "Fortsett til TING", `PUBLIC_HOST` address-bar hint, portal list, footer "TING · prototype" |
| Home | `app/(app)/home/page.tsx` | empty-state copy, `${PUBLIC_HOST}/tryggere-ruspolitikk` example, privacy note |
| Communities | `app/(app)/communities/page.tsx:49,52` | "TING har ingen katalog …" |
| Community overview | `app/(app)/community/[communityId]/page.tsx:135,311` | portal link + member-only notice via `PUBLIC_HOST` |
| Events | `app/(app)/community/[communityId]/events/page.tsx:52` | public-page hint via `PUBLIC_HOST` |
| Members | `app/(app)/community/[communityId]/members/page.tsx:115` | "… andre steder på TING" |
| Requests | `app/(app)/community/[communityId]/requests/page.tsx:58` | "sender TING en invitasjon …" |
| Request queue | `components/community/RequestQueue.tsx:183` | empty-state copy |
| Portal access form | `components/community/PortalAccess.tsx` | "TING er et separat digitalt fellesskap …" (×2) + comment |
| Profile | `app/(app)/profile/page.tsx:53,134` | "Konto på TING siden …", "TING har ingen offentlig søkefunksjon" |
| 404 | `app/not-found.tsx:22` | "TING viser ikke hvilke fellesskap som finnes" |
| Login | `app/login/page.tsx:144-145` | invitation hint via `PUBLIC_HOST` |
| Invitation page | `app/invitasjon/[token]/page.tsx:18,63,77,104-105` | "på TING.", "ingen TING-konto", legal disclaimer (×2), comment |
| Invitation email | `lib/email/invitation.ts` | subject, body text, CTA "Bli med på TING", HTML `<h1>`, separateness disclaimer — legal wording otherwise preserved |
| Email provider | `lib/email/provider.ts:2` | doc comment "seam between TING and …" (the `.vev-dev-mail` path was **not** changed — see A6) |
| Portal page | `app/(portal)/[portalSlug]/page.tsx:57,203,225` | credit comment, "Har du konto på TING?", footer `${PUBLIC_HOST}/{slug}` |
| README | `README.md:1,116` | `# TING` title; "tok i bruk TING tidlig" |
| New constant | `lib/brand.ts` | `PUBLIC_HOST = "join-ting.no"` |

**Not changed by `6fe0e9d` and correctly so** (per its commit message):
`vev.service`, unix user `vev`, `/var/www/vev`, port `3010`, GitHub repo, hosted
Supabase project, local `project_id`, DB schema/functions/RLS, migration
comments, `.vev-dev-mail/`, npm package name, `DEMO_ACCOUNT_PASSWORD` default.
This audit confirms that list and adds the deployment follow-ups in section F.

---

## Appendix — search method

```
# case-insensitive, whole tree minus generated dirs
grep -rniI --exclude-dir={node_modules,.git,.next} -E 'vev|join-ting|join-vev|ting\.no|vev\.no' .

# case-sensitive brand token
grep -rnI  --exclude-dir={node_modules,.git,.next} -E 'VEV|Vev' .

# host surfaces
cat /etc/systemd/system/vev.service
grep -rniI 'vev|3010|join-ting' /etc/nginx/
cat .git/config ; git log --format='%an <%ae>' | sort -u
grep -rniI 'create schema|create role|storage.buckets|bucket_id' supabase/migrations/
```

Every hit from those commands is accounted for above (as a finding, an
already-done item, or a documented false positive).

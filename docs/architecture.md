# Architecture

## Shape

Codex Quota Trends is a Client/Tauri repository.

```text
apps/gui/src         React presentation and interaction
apps/gui/src-tauri   Tauri commands, tray, and window lifecycle
crates/codex-quota-core
  codex              app-server JSONL process and protocol normalization
  quota              domain model, trend calculations, alert detection
  storage            SQLite schema and repositories
```

The dependency direction is `React -> Tauri commands -> core -> SQLite/app-server`.
The frontend never reads the database or starts Codex directly.

## Collection lifecycle

1. Tauri starts one background collector.
2. The core starts `codex app-server --listen stdio://`.
3. It sends `initialize`, then `initialized`.
4. It reads `account/read` and `account/rateLimits/read`.
5. A rate-limit response is normalized into one `QuotaSnapshot` per `limitId`.
6. Only changed window values are persisted.
7. `account/rateLimits/updated` triggers a fresh read; a configurable poll is
   the liveness fallback.
8. Disconnects are recorded and retried with bounded exponential backoff.

The current CLI schema was generated from Codex CLI 0.144.1. The wire model is
kept tolerant of optional account metadata and additional fields, while the
domain model stays strict about the fields it uses.

## Runtime modes

The Tauri app is the production runtime. Vite development outside Tauri uses a
clearly labeled deterministic demo adapter so the visual reference pages can be
reviewed in a browser; it is not a production transport fallback.

## Product boundaries

- Local-first: SQLite in the app data directory.
- Rust-first: collection, persistence, calculations, and alerts in Rust.
- Dynamic windows: primary/secondary app-server windows become a vector.
- No private API access and no credential file reads.
- No cloud sync, user system, AI analysis, or cost estimation.

## Update lifecycle

1. The Settings titlebar reads the installed package version locally.
2. A manual check calls the Rust updater command; the frontend never downloads or
   verifies release files itself.
3. The Tauri updater reads one signed `latest.json` manifest from GitHub Releases.
4. The Rust command downloads and installs a verified universal macOS artifact.
5. The user explicitly restarts the app after installation completes.

Release builds enable updater artifacts and use a project-specific signing key.
Only the public key is stored in `tauri.conf.json`; the private key belongs in the
local secret store and never leaves the build machine. `just release-gui` creates
the universal app, DMG, updater archive, signature, and manifest locally. GitHub
Releases may host the finished files, but GitHub Actions never builds or signs them.

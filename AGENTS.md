# Codex Quota Trends Agent Guide

## Scope

This repository is a local-first macOS Tauri application. Keep product behavior
in Rust, persistence in SQLite, and frontend code limited to presentation and
interaction.

## Required Start

1. Run `git status --short --branch`.
2. Read `docs/architecture.md` and the task-relevant spec.
3. Use root `just` targets for validation.
4. Preserve unrelated work and keep changes on a non-`main` branch.

## Boundaries

- `crates/codex-quota-core` owns app-server communication, quota analysis,
  alerts, and SQLite.
- `apps/gui/src-tauri` owns Tauri commands, tray/window lifecycle, and native
  integration.
- `apps/gui/src` owns rendering and interaction only.
- Never read `~/.codex/auth.json` or call private ChatGPT HTTP endpoints.
- Keep the quota model window-based; do not hard-code five-hour or weekly
  fields into domain types.
- Do not add cloud sync, accounts, telemetry, or a plugin system.

## Verification

- `just check`
- `just test`
- `just build-gui`
- For UI delivery, compare real rendered captures with the references under
  `docs/design/reference` and update `design-qa.md`.

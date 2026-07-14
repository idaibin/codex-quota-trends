# Verification

## Automated gates

```bash
just fmt
just check
just test
just build-gui
```

Rust tests cover protocol normalization, change-only persistence, trend speeds,
pace comparison, rapid drain, reset detection, and retention. Frontend tests
cover route/data presentation helpers and setting validation.

## App-server smoke test

With Codex authenticated, start the Tauri app and confirm:

1. Activity records `connected`.
2. Overview receives at least one real quota window.
3. The SQLite database contains a snapshot.
4. A rate-limit update or poll changes the UI without restarting.

The app must not access `~/.codex/auth.json` or a `chatgpt.com/backend-api` URL.

## Visual acceptance

1. Capture the 1448×1086 main window for Overview light/dark, Trends,
   Activity, Alerts, and Settings.
2. Capture the 520×840 tray popover state.
3. Compare each state to `docs/design/reference` at the same viewport.
4. Record evidence and remaining P3 differences in `design-qa.md`.

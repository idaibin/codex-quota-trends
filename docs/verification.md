# Verification

## Automated gates

```bash
just fmt
just check
just test
just build-gui
```

Rust tests cover protocol normalization, change-only persistence, trend speeds,
pace comparison, rapid drain, reset detection, retention, SQLite size reporting,
and post-delete compaction. Frontend tests cover route/data presentation helpers,
byte-size formatting, and setting validation.

## App-server smoke test

With Codex authenticated, start the Tauri app and confirm:

1. Activity records `connected`.
2. The tray popover receives at least one real quota window.
3. The SQLite database contains a snapshot.
4. A rate-limit update or poll changes the UI without restarting.

The app must not access `~/.codex/auth.json` or a `chatgpt.com/backend-api` URL.

## Visual acceptance

1. Capture the 420×360 tray popover with deterministic data.
2. Verify Chinese copy, axis labels, endpoint, tooltip, top status controls,
   8px window corners, and absence of product branding or footer controls.
3. Compare the supplied popover crop and implementation side by side.
4. Record evidence and remaining P3 differences in `design-qa.md`.

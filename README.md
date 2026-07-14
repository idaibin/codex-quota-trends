# Codex Quota Trends

Codex Quota Trends is a local-first macOS menu bar app that records Codex rate
limit snapshots, shows consumption trends, and warns when usage changes faster
than expected.

All product data stays on the Mac. Authentication remains owned by the installed
Codex CLI through `codex app-server`; the app never reads Codex credentials or
calls private ChatGPT endpoints.

## Status

The first implementation includes:

- event-first collection with a 60-second polling fallback;
- SQLite history with change-only writes;
- dynamic quota windows keyed by app-server `limitId`;
- a focused remaining-quota Overview, Settings, light/dark themes, and a compact
  menu bar popover;
- rapid-drain, stale-collector, and reset detection;
- CSV export, retention settings, notifications, and launch-at-login controls.

## Development

Requirements: macOS, Codex CLI, Rust 1.95, Node 24, and npm.

```bash
just install
just dev-gui
```

Run the verification suite:

```bash
just check
just test
just build-gui
```

Architecture, database, design, and verification details live in [`docs`](docs).

## Privacy

No accounts, cloud sync, analytics, or third-party telemetry are included.

## License

Apache-2.0.

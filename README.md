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
- a menu-bar-first remaining-quota surface with a detailed seven-day trend and
  an on-demand Settings window;
- rapid-drain, stale-collector, and reset detection;
- CSV export, retention settings, database cleanup, and launch-at-login controls;
- signed in-app updates delivered from GitHub Releases.

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

## Releases and updates

The Settings titlebar exposes the installed version and a compact update action.
Production builds use Tauri's signed updater with the single endpoint
`https://github.com/idaibin/codex-quota-trends/releases/latest/download/latest.json`.

Build every release locally; GitHub Actions is not part of the release path.

1. Install both macOS Rust targets once:

   ```bash
   rustup target add aarch64-apple-darwin x86_64-apple-darwin
   ```

2. Update the matching versions in `Cargo.toml`, `apps/gui/package.json`, and
   `apps/gui/src-tauri/tauri.conf.json`.
3. Run the signed universal build:

   ```bash
   just release-gui
   ```

The command reads the project key and password from `~/.codex/secrets`, creates
the app, DMG, updater archive, signature, and `latest.json` under
`target/universal-apple-darwin/release/bundle`, and never uploads them.

After inspecting the local artifacts, create the `vX.Y.Z` tag and upload those
files to the matching GitHub Release manually. GitHub Releases is only the
download endpoint; it does not build or sign the application.

## Privacy

No accounts, cloud sync, analytics, or third-party telemetry are included.

## License

Apache-2.0.

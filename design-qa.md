# Design QA

## Evidence

The supplied screens in `docs/design/reference` remain the content and styling
reference. Compact geometry is measured against the 960×680 `rustzen-clear`
client screenshot. Browser-review captures use deterministic local data:

| Surface | Viewport | Evidence |
| --- | --- | --- |
| Overview, light | 960×680 | `screenshots/actual/overview-compact.png` |
| Overview, dark | 960×680 | `screenshots/actual/overview-dark-compact.png` |
| Trends | 960×680 | `screenshots/actual/trends-compact.png` |
| Activity | 960×680 | `screenshots/actual/activity-compact.png` |
| Alerts | 960×680 | `screenshots/actual/alerts-compact.png` |
| Settings | 960×680 | `screenshots/actual/settings-compact.png` |
| Settings, storage controls | 960×680 | `screenshots/actual/settings-storage.png` |
| Menu bar popover | 420×440 | `screenshots/actual/tray-remaining-compact.png` |

The compact reference and Overview implementation were appended side by side
in `screenshots/actual/compact-reference-comparison.png` before review.
The supplied tray screenshot and the simplified implementation were normalized
and compared side by side in `screenshots/actual/tray-remaining-comparison.png`.

## Findings and fixes

- P2: the original 1448×1086 shell, 320px sidebar, and oversized panels made
  the utility feel heavier than `rustzen-clear`. The shell is now 960×680 with
  a 196px sidebar, 64px toolbar, 42px navigation rows, and 12–18px page rhythm.
- P2: the Overview pace card clipped its second progress row after the first
  density pass. The top card row was rebalanced and rechecked without overflow.
- P2: Trends and Activity initially required incidental vertical scrolling.
  Card, chart, and table density was tightened; both now fit the 960×680 view.
- P2: the original app mark was low resolution. The visible mark is now a
  transparent 256×256 PNG, with matching 512×512 app and 128×128 tray assets.
- P2: quota usage was the primary value. The ring and first metric now show the
  remaining percentage; used percentage is secondary.
- P3: Settings intentionally scrolls because it contains multiple configuration
  groups; all other primary routes fit without page scrolling.
- P3: the Data section now shows custom retention days, total SQLite disk usage,
  DB/WAL/SHM breakdown, reclaimable space, cleanup, export, and folder actions in
  one compact row. The cleanup success state was exercised with demo data.
- P2: the transparent tray window and native shadow exposed a light halo around
  all four edges in dark mode. The tray surface now owns the full rectangular
  window background with no outer border, radius, transparency, or native shadow;
  internal cards retain their spacing and radii.
- P2: the browser-preview border and shadow were also visible around the real
  Tauri main window. They are now disabled only in the native runtime; rounded
  clipping and all internal panel borders remain unchanged.
- P2: the tray repeated the remaining percentage in the ring and metrics, then
  added used quota, reset time, and a full Collector card. Its information area
  now contains one current remaining value and one 7-day remaining trend; the
  operational action rows remain available and the window is 420×440.

## Native client evidence

The newly built debug bundle was launched from
`target/debug/bundle/macos/Codex Quota Trends.app`. Process PID `7733` owned
CGWindowID `5888`, titled `Codex Quota Trends`, at exactly 960×680. Window-level
capture through `screencapture -l5888` was unavailable in the current host
permission context, so browser screenshots are the visual evidence and the
CGWindow record is the native geometry evidence. The disposable app process was
stopped after verification.

## Tray remaining simplification QA

- Source visual truth: `/var/folders/33/1n65110j6_15vm1fd1fydb440000gn/T/codex-clipboard-c69c0046-e714-4a0a-9b1a-fa3e8f6c53cd.png`.
- Implementation: `screenshots/actual/tray-remaining-compact.png`, captured in
  the in-app browser at 420×440 in the light theme with deterministic demo data.
- Full-view comparison: `screenshots/actual/tray-remaining-comparison.png`.
  A focused crop was unnecessary because the full-width 420px comparison keeps
  the logo, labels, values, chart, icons, borders, and action copy legible.
- Typography continues to use the existing system font, weights, and hierarchy;
  spacing and color tokens remain aligned with the supplied popover. The PNG logo
  and Phosphor icons are unchanged and remain sharp at the rendered size.
- Copy now describes only `Current Remaining` and `Remaining Trend (7d)` in the
  information area. The chart accessibility label is `Quota remaining over time`.
- The four existing action controls remain present with their original handlers.
  No browser console warnings or errors were reported after rendering.
- Comparison history: the initial implementation comparison found no actionable
  P0/P1/P2 layout, typography, color, asset, or copy mismatch against the scoped
  simplification brief, so no post-comparison fix pass was required.

## Reproduction

```bash
cd apps/gui
npm run dev
```

Capture the six main routes at 960×680 and `/?surface=tray` at 420×440. Append
each source and implementation image before judging visible differences.

final result: passed

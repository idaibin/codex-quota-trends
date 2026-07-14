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
| Menu bar popover | 420×680 | `screenshots/actual/tray-compact.png` |

The compact reference and Overview implementation were appended side by side
in `screenshots/actual/compact-reference-comparison.png` before review.

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

## Native client evidence

The newly built debug bundle was launched from
`target/debug/bundle/macos/Codex Quota Trends.app`. Process PID `7733` owned
CGWindowID `5888`, titled `Codex Quota Trends`, at exactly 960×680. Window-level
capture through `screencapture -l5888` was unavailable in the current host
permission context, so browser screenshots are the visual evidence and the
CGWindow record is the native geometry evidence. The disposable app process was
stopped after verification.

## Reproduction

```bash
cd apps/gui
npm run dev
```

Capture the six main routes at 960×680 and `/?surface=tray` at 420×680. Append
each source and implementation image before judging visible differences.

final result: passed

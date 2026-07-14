# Design QA

## Evidence

The supplied images in `docs/design/reference` are the visual source of truth.
The browser review mode was captured with deterministic local data at these
states:

| Surface | Reference | Capture viewport |
| --- | --- | --- |
| Overview, light | `overview-light.png` | 1448×1086 |
| Overview, dark | `overview-dark.png` | 1448×1086 |
| Trends | `trends.png` | 1448×1086 |
| Activity | `activity.png` | 1448×1086 |
| Alerts | `alerts.png` | 1448×1086 |
| Settings | `settings.png` | 1448×1086 |
| Menu bar popover | `tray-popover.png` | 520×840 popover crop |

Each reference and implementation capture was appended side by side before
review. Browser screenshots are intentionally ignored by Git and can be
regenerated under `screenshots/actual`.

## Findings and fixes

- P2: the Trends range control and lower summary cards were clipped at the
  reference viewport. The top bar is now fixed and the chart sections use the
  available height.
- P2: the first Settings implementation added an Appearance section that was
  absent from the reference. It was removed; theme remains available from the
  top bar.
- P2: the popover actions extended below the target viewport and the final
  quota label touched the chart divider. Popover density and metric line height
  were tightened, with all controls now visible at 520×840.
- P3: live quota values, dates, and event counts intentionally differ from the
  static mockups.
- P3: the browser review surface cannot reproduce native macOS title-bar and
  menu-bar shadows exactly; native-window verification covers those elements.

## Result

Passed with no open P0, P1, or P2 visual findings. Navigation, range controls,
filters, theme switching, settings toggles, alert expansion, collector pause
and resume, and popover actions were exercised during the review.

The bundled macOS application was also launched as a real 1448px Tauri window.
It spawned `codex app-server`, reached `Connected`, persisted the live quota
windows in SQLite, and rendered the active Codex quota instead of the inactive
supplemental limit.

## Reproduction

```bash
cd apps/gui
npm run dev
```

Capture the six main routes at 1448×1086 and `/?surface=tray` at 520×840. For
each state, use ImageMagick to append the reference and capture before judging:

```bash
magick docs/design/reference/overview-light.png \
  screenshots/actual/overview-light.png +append /tmp/overview-light-compare.png
```

# UI Specification

## Source of truth

The seven supplied mockups under `docs/design/reference` remain the content and
visual-language source of truth. The compact desktop geometry follows the
960×680 `rustzen-clear` client baseline. The generated transparent PNG app mark
under `apps/gui/public/app-mark.png` is the canonical visible logo asset.

## Shell

- Main window: 960×680, 196px sidebar, 1px cool-gray divider.
- Sidebar: traffic lights, 32px PNG app mark, five 42px navigation rows, and a
  collector status card anchored at the bottom.
- Content: 64px top bar with title at 22px/700, window filter, and refresh.
- Page inset: 14–18px. Panels use 11–12px radii and 1px borders.
- Only the main content scrolls. The app shell and sidebar remain fixed.
- Overview leads with quota remaining in the ring and first numeric metric;
  quota used is secondary context.

## Tokens

| Role | Light | Dark |
| --- | --- | --- |
| canvas | `#f7f8fb` | `#07111d` |
| panel | `#ffffff` | `#0b1623` |
| text | `#111827` | `#f8fafc` |
| secondary | `#64748b` | `#9aa9bd` |
| border | `#dbe2ea` | `#263445` |
| accent | `#5b3df5` | `#8067ff` |
| danger | `#ff4545` | `#ff5252` |
| success | `#23b954` | `#33d16b` |

Typography uses the macOS system stack. Numeric metrics use tabular figures.
Icons use Phosphor's regular outline weight; the app mark is a transparent PNG.

## Components

- `AppShell`: window chrome, navigation, top bar, responsive content ownership.
- `CollectorStatus`: connection state, last update, next poll.
- `QuotaRing`: remaining percentage first, followed by used percentage and reset.
- `TrendChart`: library-rendered line/area chart with shared axes and tooltip.
- `MetricCard`, `Panel`, `SegmentedControl`, `SelectControl`, `Toggle`.
- Route components: Overview, Trends, Activity, Alerts, Settings.
- `TrayPopover`: compact quota, seven-day sparkline, collector state, and four
  native-feeling actions.

## Responsive behavior

- The 960px main-window baseline keeps the full compact sidebar and three-column
  dashboard composition.
- Below 820px grids begin to collapse; below 680px navigation becomes an icon rail.
- The tray surface is 420×680 and is not treated as a mobile page.

## Interaction states

Navigation, theme, filters, segmented ranges, refresh, alert detail expansion,
settings, CSV export, reset confirmation, and tray actions are functional.
The Settings data section also supports arbitrary retention days, live SQLite
disk-size reporting, and an explicit database cleanup/compaction action.
Every control has hover, focus-visible, disabled, selected, and pressed states.
Reduced-motion users receive no animated chart/ring entrance.

## Tailwind and Tauri rules

- Tailwind owns shared spacing, typography, grids, and state variants; product
  geometry and theme colors are named CSS tokens.
- Avoid arbitrary values for ordinary spacing. Reference-specific geometry may
  use a named component class backed by tokens.
- Tauri commands return typed DTOs; the React layer never imports storage logic.
- Window labels are `main` and `tray`. The tray window is frameless, transparent,
  always on top, hidden on blur, and toggled from the tray icon.
- On macOS the app uses accessory activation policy so it behaves as a menu bar
  utility rather than a permanent Dock app.

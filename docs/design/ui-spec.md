# UI Specification

## Source of truth

The seven supplied mockups under `docs/design/reference` are the visual source
of truth. Desktop frames target a 1448×1086 capture; the tray reference is a
1086×1448 presentation of a roughly 672-pixel-wide macOS popover.

## Shell

- Main window: 1448×1086 reference ratio, 320px sidebar, 1px cool-gray divider.
- Sidebar: traffic lights, 40px app mark, five 56px navigation rows, and a
  collector status card anchored at the bottom.
- Content: 30px top bar with title at 30px/700, window filter, and refresh.
- Page inset: 28–32px. Panels use 14–16px radii and 1px borders.
- Only the main content scrolls. The app shell and sidebar remain fixed.

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
Icons use Phosphor's regular outline weight; the app mark is the supplied asset.

## Components

- `AppShell`: window chrome, navigation, top bar, responsive content ownership.
- `CollectorStatus`: connection state, last update, next poll.
- `QuotaRing`: window-agnostic used percentage and reset summary.
- `TrendChart`: library-rendered line/area chart with shared axes and tooltip.
- `MetricCard`, `Panel`, `SegmentedControl`, `SelectControl`, `Toggle`.
- Route components: Overview, Trends, Activity, Alerts, Settings.
- `TrayPopover`: compact quota, seven-day sparkline, collector state, and four
  native-feeling actions.

## Responsive behavior

- At 1100px the sidebar narrows and long brand text hides.
- At 820px navigation becomes a compact icon rail and dashboard grids collapse.
- The tray surface has a fixed desktop width and is not treated as a mobile page.

## Interaction states

Navigation, theme, filters, segmented ranges, refresh, alert detail expansion,
settings, CSV export, reset confirmation, and tray actions are functional.
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

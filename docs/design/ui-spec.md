# UI Specification

## Source of truth

The seven supplied mockups under `docs/design/reference` remain the visual-language
reference. The current focused information architecture intentionally removes
their repeated dashboard content and route sidebar. The compact desktop geometry
follows the 960×680 `rustzen-clear` client baseline. The generated transparent PNG
app mark under `apps/gui/public/app-mark.png` is the canonical visible logo asset.

## Shell

- Main window: 960×680 with no sidebar or tree navigation.
- Content: 64px top bar with traffic lights, 32px PNG app mark, product and page
  titles, window filter, refresh, theme, and one Settings entry.
- Page inset: 14–18px. Panels use 11–12px radii and 1px borders.
- Only the main content scrolls. The app shell remains fixed.
- Overview contains only current remaining quota and the remaining trend.

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

- `AppShell`: window chrome, product identity, top bar, Settings entry, and
  responsive content ownership.
- `QuotaRing`: remaining percentage first, followed by used percentage and reset.
- `TrendChart`: library-rendered line/area chart with shared axes and tooltip.
- `MetricCard`, `Panel`, `SegmentedControl`, `SelectControl`, `Toggle`.
- Exposed route components: Overview and Settings.
- `TrayPopover`: current remaining quota, seven-day remaining sparkline, and four
  native-feeling actions.

## Responsive behavior

- The 960px main-window baseline uses a compact current-value rail beside the
  remaining-trend chart.
- Below 680px the two Overview panels collapse to one column.
- The tray surface is 420×440 and is not treated as a mobile page.

## Interaction states

Product-title navigation, theme, filter, refresh, Settings, CSV export, reset
confirmation, and tray actions are functional.
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
- Window labels are `main` and `tray`. The tray window is frameless, opaque,
  shadowless, always on top, hidden on blur, and toggled from the tray icon.
- On macOS the app uses accessory activation policy so it behaves as a menu bar
  utility rather than a permanent Dock app.

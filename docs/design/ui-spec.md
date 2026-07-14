# UI Specification

## Source of truth

The supplied mockups remain the visual-language reference. The current product
surface is the macOS menu bar popover; the dashboard window is hidden by default
and used only for Settings. The generated transparent PNG app mark under
`apps/gui/public/app-mark.png` is the canonical visible logo asset.

## Shell

- Menu bar item: a monochrome template version of the existing quota curve with
  no purple tile, followed by the rounded current remaining percentage. The title
  refreshes from the latest local quota snapshot without opening the popover.
- Menu bar popover: 420×170, frameless, opaque, shadowless, and hidden on blur.
- The popover has no header or inline utility actions. Right-clicking the menu-bar
  item exposes pause/resume, Settings, and Quit in a compact native Chinese menu.
- The popover has no separate remaining-summary block. Reset timing belongs to the
  chart heading; the range badge shows cumulative consumption for the visible history
  by adding every usage increase and ignoring reset decreases.
- The trend renders directly on the popover canvas without an enclosing card,
  border, radius, outer padding, or elevated panel background. CSS Grid owns the
  heading/chart rows; the chart's own plot margin controls its four safe insets.
- Trend: the primary content region with a dynamic percentage domain, three
  horizontal guides, fixed left/center/right time-only X-axis labels, a hidden
  Y axis, reset time in the upper-left heading,
  endpoint marker, area fill, and a precise hover tooltip. The first and middle
  representative values are quiet labels; the latest value uses an accent label
  and halo marker. Axis labels use smaller, muted type with compact margins.
  Timestamps use a continuous numeric axis so irregularly collected source points
  retain their real temporal spacing instead of being rendered as equal categories.
  The plot fills its Grid row and adds 5% of the observed range above the maximum
  and below the minimum, keeping the curve clear of the outer guides without
  introducing fixed percentage bounds. Quota percentages render as whole numbers.
  The area uses a restrained vertical accent gradient, rounded strokes, and a
  low-contrast grid so the current-value marker remains the strongest chart element.
- Visible popover copy, chart labels, tooltips, and accessibility names use Chinese.
- The native window and its content clip to an 8px corner radius.

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
Window, panel, and control radii are respectively 8px, 10px, and 8px across both
the tray and Settings surfaces.

## Components

- `TrayPopover`: the primary product surface and owner of the trend heading and chart.
- `TrayRemainingChart`: a library-rendered 24-hour area chart with time-only labels,
  hidden Y-axis ticks, dynamic bounds, endpoint marker, and tooltip.
- `SettingsRoute`: the only on-demand main-window route.
  It uses a 520×580 single-column preferences window with no branded top bar.
  Theme selection is a normal row in the General group. Compact Chinese-only
  groups cover general behavior, data storage, and local-data removal;
  supporting descriptions appear only when they add actionable information
  such as reclaimable disk space.
  Section cards use quiet one-pixel borders, compact 42px rows, 30px controls,
  and matching icon/caret weights. Auto-save confirmation appears briefly in the
  otherwise unused native titlebar area rather than covering destructive actions.

## Responsive behavior

- The tray surface is fixed at 420×170 and is not treated as a mobile page.
- Chart labels and plot margins are sized to remain fully visible at that width.
- The Settings surface is fixed to a compact 520px width. Its native titlebar
  area is left clear for macOS traffic lights, and all controls flow in one column.

## Interaction states

Settings, collector pause/resume, Quit, CSV export, and reset confirmation are
functional. The dashboard entry is intentionally absent.
The Settings data section also supports arbitrary retention days, live SQLite
disk-size reporting, and an explicit database cleanup/compaction action.
Every control has hover, focus-visible, disabled, selected, and pressed states.
Settings selects have explicit accessible names and auto-save changes are announced
through a polite status region.
Reduced-motion users receive no animated chart/ring entrance.

## Tailwind and Tauri rules

- Tailwind owns shared spacing, typography, grids, and state variants; product
  geometry and theme colors are named CSS tokens.
- Avoid arbitrary values for ordinary spacing. Reference-specific geometry may
  use a named component class backed by tokens.
- Tauri commands return typed DTOs; the React layer never imports storage logic.
- Window labels are `main` and `tray`. `main` starts hidden; `tray` is frameless,
  opaque, shadowless, always on top, hidden on blur, and toggled from the tray icon.
- On macOS the app uses accessory activation policy so it behaves as a menu bar
  utility rather than a permanent Dock app.

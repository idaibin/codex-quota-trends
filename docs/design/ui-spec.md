# UI Specification

## Source of truth

The supplied mockups remain the visual-language reference. The current product
surface is the macOS menu bar popover; the dashboard window is hidden by default
and used only for Settings. The generated transparent PNG app mark under
`apps/gui/public/app-mark.png` is the canonical visible logo asset.

## Shell

- Menu bar popover: 420×500, frameless, opaque, shadowless, and hidden on blur.
- Header: 34px PNG app mark, product name, and one Settings gear.
- Remaining summary: current percentage, quota-window label, reset countdown,
  and the remaining-point change for the visible range.
- Trend: the primary content region with a dynamic percentage domain, three
  horizontal guides, contextual time labels, endpoint marker, area fill, and
  a precise hover tooltip.
- Footer: collector state, last update, pause/resume, and Quit.

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

- `TrayPopover`: the primary product surface and owner of remaining summary,
  trend, collector state, and compact utility controls.
- `TrayRemainingChart`: a library-rendered area chart with adaptive 24-hour or
  seven-day labels, dynamic bounds, endpoint marker, and tooltip.
- `SettingsRoute`: the only on-demand main-window route.

## Responsive behavior

- The tray surface is fixed at 420×500 and is not treated as a mobile page.
- Chart labels and plot margins are sized to remain fully visible at that width.

## Interaction states

Settings, collector pause/resume, Quit, CSV export, and reset confirmation are
functional. The dashboard entry is intentionally absent.
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
- Window labels are `main` and `tray`. `main` starts hidden; `tray` is frameless,
  opaque, shadowless, always on top, hidden on blur, and toggled from the tray icon.
- On macOS the app uses accessory activation policy so it behaves as a menu bar
  utility rather than a permanent Dock app.

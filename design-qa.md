# Design QA

## Evidence

- Source visual truth: `/var/folders/33/1n65110j6_15vm1fd1fydb440000gn/T/codex-clipboard-59ab3ad9-78be-441b-8ba1-e4a48c254901.png`.
- Source popover crop: `screenshots/actual/tray-source-crop.png`.
- Implementation: `screenshots/actual/tray-focused-v2.png`.
- Tooltip state: `screenshots/actual/tray-focused-tooltip.png`.
- Viewport: 420×500, light theme, deterministic local quota data.
- Full-view comparison: `screenshots/actual/tray-focused-comparison.png`.
- Focused-region comparison was unnecessary because the normalized 420px views
  keep all typography, controls, chart axes, endpoint, logo, and borders legible.

## Findings and comparison history

- P2, first pass: the left Y-axis labels were clipped and 24-hour X-axis labels
  repeated the same calendar date. The chart margin was corrected and the X-axis
  now selects time labels for 24-hour data and dates for multi-day data.
- Post-fix evidence: `screenshots/actual/tray-focused-v2.png` shows complete
  60/70/80% labels, three distinct time labels, and an unobstructed endpoint.
- No actionable P0/P1/P2 findings remain after the second comparison.

## Required fidelity surfaces

- Fonts and typography: the existing macOS system stack, compact optical weights,
  tabular quota figures, and restrained uppercase eyebrow establish clear hierarchy.
- Spacing and layout rhythm: the 420×500 frame uses one 15px-radius content card,
  a 14px outer inset, and a stable header-summary-chart-footer rhythm with no scroll.
- Colors and tokens: the existing purple accent, neutral canvas, semantic green
  collector state, and low-contrast grid lines remain consistent in light and dark.
- Image quality and assets: the supplied PNG logo remains sharp at 34px; all utility
  controls use the existing Phosphor icon library with no placeholder artwork.
- Copy and content: the surface prioritizes current remaining, reset time, range
  change, and the remaining trend. Open Dashboard and duplicate Settings rows are gone.

## Interaction evidence

- The in-app browser DOM exposes exactly three controls: Settings, pause/resume,
  and Quit. No Dashboard action is rendered.
- The chart exposes current Y-axis percentages, range-appropriate X-axis labels,
  a readable hover tooltip, and the latest-point marker.
- Pause changed the footer to `Collector paused` and Resume restored the connected
  state. The browser console reported no warnings or errors.
- Native debug PID `26615` reported hidden 960×680 `main` window CGWindowID
  `6900` and hidden 420×500 `tray` window CGWindowID `6901`, confirming the
  menu-bar-only startup state and requested tray geometry. Native Settings-window
  interaction was not automated in this pass.

## Follow-up polish

- P3: when a full seven days of real history exists, confirm three date ticks stay
  readable in both English and localized macOS date formats.

final result: passed

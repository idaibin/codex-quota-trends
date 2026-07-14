# Design QA

## Evidence

- Source visual truth: `/var/folders/33/1n65110j6_15vm1fd1fydb440000gn/T/codex-clipboard-70e8982a-2269-46c3-b872-d92441ff2b49.png`.
- Normalized source: `screenshots/actual/tray-compact-source.png`.
- Implementation: `screenshots/actual/tray-compact-preview.png`.
- Full-view comparison: `screenshots/actual/tray-compact-comparison.png`.
- Native viewport contract: 420×420, light theme, deterministic local quota data.
- The fallback Chromium capture uses a 500×420 viewport because the local browser
  enforces a 500px minimum width; the 420px native width is verified by the Tauri
  configuration and the layout uses shrink-safe flex containers.
- Focused-region comparison was unnecessary because the normalized comparison
  keeps the header controls, all Chinese copy, axes, endpoint, and corners legible.

## Findings and fixes

- P2: the product mark and English product name occupied the most valuable top-left
  area. The brand block was removed completely.
- P2: collector state and pause/Quit actions were detached below the primary card.
  They now share one compact top status bar with the Settings control.
- P2: visible labels, relative time, reset duration, range change, chart tooltip,
  empty states, and accessible control names mixed English with Chinese. All popover
  content now uses Chinese and Chinese date/time formatting.
- P2: the frameless native surface had square corners. The tray webview is transparent,
  while root, popover, and content clipping all resolve to an 8px border radius.
- P2: the 500px-tall popover repeated trend context and used oversized whitespace.
  The native height is now 420px, the trend subtitle is removed, the status and quota
  rows are denser, and the chart is reduced from 230px to 205px without losing axes.
- No actionable P0/P1/P2 findings remain after the implementation comparison.

## Required fidelity surfaces

- Fonts and typography: the macOS system stack and tabular quota figures are retained;
  Chinese hierarchy remains readable without clipping or unintended wrapping.
- Spacing and layout rhythm: the top status row, quota summary, and trend heading are
  compressed into a 420×420 surface while preserving a readable 205px trend chart.
- Colors and tokens: the purple trend, neutral surface, and semantic collector state
  reuse the existing light/dark design tokens.
- Image quality and assets: no visible raster asset remains after the requested brand
  removal; utility controls continue to use the existing Phosphor icon library.
- Copy and content: all visible product copy and interactive labels are Chinese.

## Runtime evidence

- The rendered capture exposes `采集器已连接`, Chinese update time, all three action
  icons, Chinese quota/reset/change labels, `剩余额度趋势`, axes, and endpoint.
- The in-app browser bridge could not initialize in this run because of a runtime
  property conflict. Visual QA used isolated local Chromium against the same Vite
  surface; browser console inspection was therefore not repeated.

## Settings simplification

- Source visual truth: `/var/folders/33/1n65110j6_15vm1fd1fydb440000gn/T/codex-clipboard-4b970c34-9d01-4f02-ada2-802a5a06d871.png`.
- Implementation: `screenshots/actual/settings-zh-compact-v3.png`.
- Comparison: `screenshots/actual/settings-zh-comparison.png`.
- Viewport: 960×680, light theme, deterministic local data.
- English headings, labels, options, actions, confirmations, loading text, and
  accessibility names are replaced with concise Chinese copy.
- Collector and startup controls are grouped under `常规`; thresholds and
  notifications are grouped under `提醒`; retention, disk usage, cleanup, export,
  and folder access are grouped under `数据`.
- Repeated explanatory paragraphs, the duplicate product name, the refresh action,
  and the current-page Settings action are removed from the Settings surface.
- The compact rows and action cards keep all controls, storage details, and the
  destructive action visible in a single 960×680 window without scrolling.

## Tray chart labels and spacing

- Source visual truth: `/var/folders/33/1n65110j6_15vm1fd1fydb440000gn/T/codex-clipboard-e6d7f422-f818-4fec-afaa-21052d3f90e7.png`.
- Implementation: `screenshots/actual/tray-labels-v2.png`.
- Comparison: `screenshots/actual/tray-labels-comparison.png`.
- Native viewport contract: 420×420. The fallback Chromium capture is 500×420
  because its local headless window enforces a 500px minimum width.
- The trend section now fills the remaining card height, moving the time axis close
  to the lower edge instead of leaving an unused footer-sized area.
- Horizontal padding and the Y-axis width are reduced while preserving complete
  percentage ticks. First, middle, and latest remaining values appear above the
  curve; limiting labels to three avoids collisions and visual noise.

## Tray time scale

- Source visual truth: `/var/folders/33/1n65110j6_15vm1fd1fydb440000gn/T/codex-clipboard-7a18064c-9f6f-4d97-86d3-72b7752a94e4.png`.
- Implementation: `screenshots/actual/tray-time-scale-v2.png`.
- Comparison: `screenshots/actual/tray-time-scale-comparison.png`.
- The X axis is numeric and continuous, and the area curve uses the original stored
  timestamps. Uneven collection intervals therefore occupy proportional horizontal
  distance instead of equal category slots.
- Axis labels use actual first, temporal-middle, and latest source records. No
  synthetic five-minute points or interpolated quota values are introduced.
- Spans near 24 hours include both date and time so identical clock times on adjacent
  days remain distinguishable; longer multi-day spans continue to use date labels.

## Settings without reminders

- Source visual truth: `/var/folders/33/1n65110j6_15vm1fd1fydb440000gn/T/codex-clipboard-739c0a6d-6458-49b4-b2be-d0719c68e99b.png`.
- Implementation: `screenshots/actual/settings-no-reminders-14-days.png`.
- Comparison: `screenshots/actual/settings-no-reminders-comparison.png`.
- Viewport: 960×680, light theme, deterministic local data.
- The entire reminder group is removed, leaving only general behavior, data storage,
  and local-data removal on the Settings surface.
- New installs and the deterministic browser adapter show a 14-day retention default;
  the existing 1–365 day validation and user-configured persisted values remain intact.
- The removed native notification task and Tauri notification plugin ensure hidden
  reminder settings cannot continue producing desktop notifications in the background.

## Flat tray content

- Source visual truth: `/var/folders/33/1n65110j6_15vm1fd1fydb440000gn/T/codex-clipboard-7a0c56dc-064e-4dea-86ad-0e645a08b4d6.png`.
- Implementation: `screenshots/actual/tray-flat-layout-v1.jpg`.
- Full-view comparison: `screenshots/actual/tray-flat-layout-comparison.png`.
- Viewport: 420×420, light theme, tray surface. The reference and implementation
  contain different live quota values, so comparison is limited to the annotated
  container treatment and preserved information hierarchy.
- Earlier P2 finding: the remaining summary and chart were enclosed by a white card
  with a visible border and 8px inner radius, contrary to the requested direct layout.
- Fix: `.tray-overview` now has no border or radius and uses a transparent background;
  its semantic `main` container and the summary-to-chart divider remain intact.
- Post-fix evidence: the implementation shows the summary and trend directly on the
  popover canvas with no enclosing card edge, corner, or elevated background.
- Focused-region comparison was unnecessary because the changed container occupies
  the complete 420×420 surface and its edges are clearly visible in the full view.
- Fonts and typography, token colors, icon assets, chart rendering, copy, controls,
  and hover/focus behavior are unchanged; no new image assets were required.
- No actionable P0/P1/P2 findings remain for the requested flat-container change.

## Menu bar percentage and template icon

- Source visual truth: `/var/folders/33/1n65110j6_15vm1fd1fydb440000gn/T/codex-clipboard-9fc06c34-18aa-4b3a-91ce-0deb25942c48.png`.
- Native implementation region: `screenshots/actual/menu-bar-percentage-region.png`.
- Focused implementation: `screenshots/actual/menu-bar-percentage-focused.png`.
- Focused comparison: `screenshots/actual/menu-bar-percentage-comparison.png`.
- Viewport and state: macOS menu bar, 720×40 points captured at 2× scale,
  light menu-bar appearance, latest stored quota showing 57% remaining.
- Earlier P2 finding: the tray item exposed only a purple rounded-square app icon,
  so the current remaining quota could not be read without opening the popover.
- Fix: the tray uses a transparent macOS template rendering of the existing quota
  curve and a native title containing the rounded remaining percentage.
- Post-fix evidence: the focused native capture shows the curve followed by `57%`,
  with no purple tile, colored surround, raster halo, or extra card background.
- The full native region proves alignment with neighboring macOS status items; the
  focused comparison is required because the icon and title are too small to judge
  accurately in the full 720-point strip.
- Typography is native macOS menu-bar text; spacing follows the system status-item
  layout; color adapts through template rendering; the reused curve remains sharp;
  and the percentage is concise without duplicated words.
- Interaction is unchanged: clicking the icon/title keeps toggling the existing
  popover, and the percentage refreshes from the latest local snapshot.
- No actionable P0/P1/P2 findings remain for the requested menu-bar change.

## Context-menu actions and refined current value

- Source visual truth: `/var/folders/33/1n65110j6_15vm1fd1fydb440000gn/T/codex-clipboard-1ea9f71f-b408-44c2-a175-6164a431759c.png`.
- Browser-rendered implementation: `screenshots/actual/tray-popover-browser-final.png`.
- Full-view comparison: `screenshots/actual/tray-popover-comparison.png`.
- Native interaction evidence: `screenshots/actual/tray-context-menu-final.png`.
- Viewport and state: 420×420, light tray surface, populated 24-hour trend. The
  source uses live 57% data while the browser adapter uses deterministic 68% data;
  comparison is limited to hierarchy, typography, spacing, and chart treatment.
- Earlier P2 findings: the inline collector/action header consumed vertical space;
  the chart heading repeated the trend title; the axis type was visually heavy; and
  the latest value was indistinguishable from the other representative labels.
- Fixes: the header and its stale frontend commands were removed; pause/resume,
  Settings, and Quit moved to the native Chinese context menu; reset time moved to
  the chart heading; axes use 9px muted type and lighter grid strokes; and the latest
  value uses the accent color plus a two-layer halo marker.
- First post-fix capture exposed a slash-formatted date and selectable heading text.
  The date was changed to explicit Chinese month/day copy and the native tray surface
  now prevents accidental text selection. The final comparison shows both fixes.
- Fonts and typography: the system stack is preserved; smaller axis labels remain
  legible, and the current value has the strongest chart-label emphasis.
- Spacing and layout: removing the header gives the summary and chart the full window;
  the divider, chart margins, 8px outer radius, and compact range pill remain aligned.
- Colors and tokens: existing canvas, accent, grid, fill, muted, and border tokens are
  reused in light and dark modes; no new arbitrary palette was introduced.
- Image and asset fidelity: no new raster or illustrative assets were needed; the
  existing Recharts area and Phosphor change icon remain sharp at native scale.
- Copy and content: all visible popover and native-menu copy is Chinese. Reset time is
  concrete, and the duplicate relative-reset line is removed from the summary.
- The full 420×420 comparison is also the focused component comparison: the changed
  heading, axis labels, and highlighted endpoint are readable at their delivered size,
  so a separate crop would not add evidence.
- Primary interactions tested: native menu opened; `暂停采集` changed to `继续采集`;
  collector was immediately resumed; Settings and Quit remained present. Browser
  console contained no warnings or errors.
- No actionable P0/P1/P2 findings remain for the requested tray refinement.

final result: passed

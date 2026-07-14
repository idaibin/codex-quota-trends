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

final result: passed

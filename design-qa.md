# Design QA

## Unified tray and Settings refinement

- Current-run audit evidence: `screenshots/actual/unified-tray-before.png` and
  `screenshots/actual/unified-settings-before.png`.
- Accepted implementation: `screenshots/actual/unified-tray-final.png`,
  `screenshots/actual/unified-settings-final.png`, and
  `screenshots/actual/unified-settings-dark-final.png`.
- Side-by-side review: `screenshots/actual/unified-tray-comparison.png` and
  `screenshots/actual/unified-settings-comparison.png`.
- Viewports: tray 420×170; Settings 520×580; deterministic local browser data.
- P2 visual finding: the two surfaces used similar colors but inconsistent window,
  panel, and control radii. Named 8px/10px/8px geometry now keeps the native window,
  preference cards, selects, inputs, range pill, and destructive action aligned.
- P2 chart finding: the tray trend used a flat area fill and comparatively strong
  guides. A restrained accent gradient, round line joins, softer grid, smaller
  tooltip, and balanced 30px heading row now improve depth without reintroducing a
  card, outer padding, or duplicated content.
- P2 Settings finding: action icons and controls carried mixed sizes, and the save
  toast could cover the destructive action. Controls and icons now share a compact
  scale; the temporary save status occupies the unused native titlebar area.
- Accessibility finding: the two Settings selects had no accessible names and the
  save acknowledgement was not announced. Both selects are explicitly named and
  the temporary status uses a polite live region. Screenshot evidence cannot prove
  complete keyboard or assistive-technology compatibility; semantic snapshots and
  focused interaction checks cover the changed controls.
- Light and dark Settings states were rendered at the delivered size. Browser logs
  contained no warnings or errors, and the theme selector remained functional.
- No actionable P0/P1/P2 findings remain for the requested consistency pass.

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

## Compact single-column Settings window

- Source visual truth: `/var/folders/33/1n65110j6_15vm1fd1fydb440000gn/T/codex-clipboard-c07aa689-0665-4e3c-ad49-c6cd1f309a1b.png`.
- Browser-rendered implementation: `screenshots/actual/settings-compact-browser.png`.
- Native Tauri evidence: `screenshots/actual/settings-compact-native.png`.
- Full-view comparison: `screenshots/actual/settings-compact-comparison.png`.
- Viewport and state: 520×580, light theme, populated local storage statistics.
  The source is the preceding 960×680 design and is normalized onto a 520×580
  comparison canvas; the viewport reduction is the requested product change, so
  comparison focuses on retained hierarchy, density, and control readability.
- Earlier P2 findings: the 960px window left excessive unused space; the branded
  top bar repeated the current page title; the top-right theme button separated a
  persistent preference from the other settings; and three horizontal data-action
  buttons became too small for a compact window.
- Fixes: the native window is 520×580; the Settings route omits the branded top bar;
  theme is a normal three-state row in the General group; and database cleanup,
  export, and folder access are full-width list items with consistent affordances.
- Post-fix visual evidence: the exact-size browser capture shows all settings without
  horizontal overflow or clipped copy and leaves only a small bottom inset. The
  real Tauri capture identifies the app-owned window and confirms the native macOS
  traffic lights remain clear of content; its earlier 520×620 height was tightened
  to 580 after that capture to remove the remaining empty footer space.
- Fonts and typography: the macOS system stack remains unchanged; group labels are
  quieter 12px metadata while row labels retain stronger readable weight.
- Spacing and layout: one column, 12px outer inset, 10px group rhythm, 42px rows,
  11px panel radii, and a clear 36px native-titlebar inset produce a compact rhythm.
- Colors and tokens: existing canvas, panel, border, accent, muted, and danger tokens
  are reused in light and dark themes with no new arbitrary palette.
- Image and asset fidelity: no new bitmap assets were required. Existing Phosphor
  icons remain sharp and consistent; the removed top-bar logo is intentionally absent.
- Copy and content: visible labels remain concise Chinese; default retention remains
  14 days for new installs, and disk totals plus reclaimable space remain visible.
- Focused-region comparison was not separate because the full 520px window keeps
  every changed row, icon, label, and control readable at delivered size.
- Primary interactions tested: theme changed from light to dark and back through the
  new row, with the root theme updating each time; all controls were present in the
  accessibility snapshot; browser console contained no warnings or errors.
- No actionable P0/P1/P2 findings remain for the compact Settings redesign.

## Reset-safe cumulative consumption

- Source visual truth: `/var/folders/33/1n65110j6_15vm1fd1fydb440000gn/T/codex-clipboard-f8970cc7-f755-420d-bc01-fbac9810a1b9.png`.
- Browser-rendered implementation: `screenshots/actual/tray-cumulative-consumption-browser.png`.
- Full-view comparison: `screenshots/actual/tray-cumulative-consumption-comparison.png`.
- Viewport and state: 420×420, light tray surface, deterministic 24-hour trend.
  The source and implementation use different quota snapshots, so comparison is
  limited to information hierarchy, range metadata, spacing, and chart treatment.
- Earlier P2 finding: the upper summary repeated a range-change metric while the
  range pill exposed only `24小时`, leaving no reset-safe measure of consumption.
- Fix: the repeated upper metric is removed. The chart pill now reads
  `24小时 · 已消耗 6%`, keeping the period and its cumulative consumption together.
- Calculation evidence: core tests sum only positive adjacent used-percentage changes,
  ignore the decrease caused by a reset to 100% remaining, and prove that later
  consumption continues accumulating beyond 100% instead of resetting or capping.
- Post-fix visual evidence: the comparison shows a quieter summary, an aligned compact
  pill, and unchanged chart emphasis. Browser accessibility output contains the new
  Chinese label and no `区间变化` text.
- Native Tauri runtime and the same frontend source were verified locally. Native
  tray-window capture was unavailable because the macOS Accessibility click did not
  expose an app window, so the exact 420×420 browser render is the visual proof.
- No actionable P0/P1/P2 findings remain for the requested cumulative metric.

## Compact fixed-24-hour tray

- Previous implementation baseline: `screenshots/actual/tray-cumulative-consumption-browser.png`.
- Browser-rendered implementation: `screenshots/actual/tray-compact-24h-final.jpg`.
- Full-view comparison: `screenshots/actual/tray-compact-24h-comparison.png`.
- Viewport and state: 420×360, light tray surface, deterministic 24-hour trend.
- Requested simplifications: the quota-window label above the current percentage is
  removed, Y-axis tick labels are hidden, and every X-axis tick uses time-only copy.
- The backend history query and cumulative-consumption calculation now share the same
  fixed 24-hour window, preventing a seven-day statistic from being presented as 24 hours.
- First visual pass exposed a clipped first data label after reclaiming the Y-axis width.
  The plot keeps a 22px safety inset without restoring visible Y-axis content; the final
  capture shows all three value labels and all three time ticks fully visible.
- The popover height is reduced from 420px to 360px. The summary, divider, reset time,
  range pill, chart endpoint, and 8px outer radius remain aligned and readable.
- Browser accessibility output contains no quota-window label or Y-axis ticks, lists
  only three clock-time X-axis values, and reports no console warnings or errors.
- No actionable P0/P1/P2 findings remain for the compact fixed-24-hour tray.

## Chart-only 128px tray

- Previous implementation baseline: `screenshots/actual/tray-compact-24h-final.jpg`.
- Browser-rendered implementation: `screenshots/actual/tray-chart-only-128.jpg`.
- Full-view comparison: `screenshots/actual/tray-chart-only-128-comparison.jpg`.
- Viewport and state: 420×184, light tray surface, deterministic 24-hour trend
  with a fixed 128px chart.
- The standalone 68% summary and its divider are removed. Reset time and cumulative
  24-hour consumption now form the only header above the trend.
- The Y-axis remains visually hidden, while its three grid positions use the observed
  range directly: the upper guide intersects the 74% maximum and the lower guide
  intersects the 68.1% minimum. Equal-value histories retain a safe two-point domain.
- Plot margins move outward from 22/20px to 12/14px. The final capture keeps the first
  and current value labels, endpoint halo, and time labels within the viewport.
- Browser accessibility output contains no standalone current percentage or divider;
  the tooltip contract remains available and no console warnings or errors were found.
- No actionable P0/P1/P2 findings remain for the chart-only 128px tray.

## Five-percent chart breathing room

- Previous implementation baseline: `screenshots/actual/tray-chart-only-128.jpg`.
- Browser-rendered implementation: `screenshots/actual/tray-padding-5-final.jpg`.
- Full-view comparison: `screenshots/actual/tray-padding-5-comparison.jpg`.
- Viewport and state: 420×170, light tray surface, deterministic 24-hour trend
  with a fixed 128px chart.
- The chart domain now extends by 5% of the observed value span above the maximum
  and below the minimum. Flat histories retain a safe one-point fallback margin.
- Outer tray padding is reduced from 10px to 6px, chart-section padding from
  `8px 6px 3px` to `4px 2px 1px`, and heading inline padding from 3px to 1px.
- The compacted 170px window keeps the reset time, consumption pill, first/current
  labels, endpoint halo, and time ticks readable without clipping.
- Browser accessibility output and console inspection report no warnings or errors.
- No actionable P0/P1/P2 findings remain for the requested spacing adjustment.

## Tray time-label clipping correction

- Previous implementation baseline: `screenshots/actual/tray-padding-5-final.jpg`.
- Browser-rendered implementation: `screenshots/actual/tray-time-label-visible.jpg`.
- Full-view comparison: `screenshots/actual/tray-time-label-visible-comparison.jpg`.
- Viewport and state: 420×170, light tray surface, fixed 128px chart.
- The tray surface now owns the intended 6px outer inset. The previous spacing edit
  had changed an unrelated alert summary while leaving the tray at 10px; that alert
  spacing is restored and the tray inset is corrected at its actual layout owner.
- The 170px document has no vertical overflow. Browser geometry places the X-axis
  labels at 147.44–164.44px, leaving 5.56px before the viewport edge.
- Reset time, cumulative consumption, percentage labels, endpoint halo, and both
  visible time ticks remain readable; browser console inspection reports no warnings
  or errors.
- No actionable P0/P1/P2 findings remain for the clipping correction.

## Fixed left-center-right time ticks

- Previous implementation baseline: `screenshots/actual/tray-time-label-visible.jpg`.
- Browser-rendered implementation: `screenshots/actual/tray-three-time-ticks.jpg`.
- Full-view comparison: `screenshots/actual/tray-three-time-ticks-comparison.jpg`.
- Viewport and state: 420×170, light tray surface, fixed 128px chart.
- Automatic tick omission is disabled for the three requested timestamps. A custom
  tick renderer left-aligns the first time, centers the temporal midpoint, and
  right-aligns the latest time so all three labels stay inside the plot bounds.
- Browser geometry confirms all three time labels at 147.44–164.44px vertically;
  the left label starts at 20px and the right label ends at 398px.
- Hovering the chart still exposes the Chinese remaining-quota tooltip, and browser
  console inspection reports no warnings or errors.
- No actionable P0/P1/P2 findings remain for the three-tick layout.

## Grid-owned tray spacing and integer current quota

- Previous implementation baseline: `screenshots/actual/tray-three-time-ticks.jpg`.
- Browser-rendered implementation: `screenshots/actual/tray-grid-current-quota.jpg`.
- Full-view comparison: `screenshots/actual/tray-grid-current-quota-comparison.jpg`.
- Viewport and state: 420×170, light tray surface, deterministic 24-hour trend.
- Read-only SQLite evidence shows the latest real `codex` weekly row at 47% used,
  which corresponds to 53% remaining. The prior 68.1% image was browser demo data,
  not a production-data failure; demo history and its snapshot are now aligned.
- The tray and chart containers have zero outer padding. CSS Grid owns the
  `28px 136px 6px` heading/chart/bottom tracks, while the chart margin owns
  the plot's 20px left, 28px right, 18px top, and 1px bottom safe insets.
- All quota percentages render as integers. The final 53% label spans 378.70–405.30px,
  and X-axis labels end at 166.94px, so neither touches the 420×170 viewport edge.
- Hovering the trend reports an integer Chinese remaining-quota tooltip; browser
  console inspection reports no warnings or errors.
- No actionable P0/P1/P2 findings remain for the grid and quota-value corrections.

final result: passed

## Reset discontinuity and minimum value

- Source visual truth: `/var/folders/33/1n65110j6_15vm1fd1fydb440000gn/T/codex-clipboard-2c85ad90-5d57-4ef0-a86b-a81686a957e3.png`.
- Browser-rendered implementation: `screenshots/actual/tray-reset-jump.png`.
- Viewport and state: 420×170, light tray surface, deterministic 24-hour history
  containing one weekly-quota reset.
- The minimum remaining value is always labeled independently of the temporal
  midpoint. The deterministic capture shows 51% as the minimum and 97% as current.
- The reset is represented by two samples at the same timestamp: the final
  pre-reset value and the reset value. Linear rendering therefore produces a
  vertical 51%→100% discontinuity rather than a gradual recovery curve.
- Unit coverage verifies the inserted reset boundary and confirms ordinary small
  quota corrections do not create a false reset.
- The 420×170 capture keeps the minimum marker, reset jump, current-value halo,
  cumulative consumption, and all three time labels visible without clipping.
- No actionable visual issue remains for the requested reset semantics.

## Visible reset value

- Source visual truth: `/var/folders/33/1n65110j6_15vm1fd1fydb440000gn/T/codex-clipboard-7325e170-49ca-43a4-8f99-a2a6c3fef8db.png`.
- Browser-rendered implementation: `screenshots/actual/tray-reset-label.png`.
- Viewport and state: 420×170, light tray surface, deterministic history with a
  complete quota reset.
- The first post-reset point now has its own integer percentage label. The capture
  shows 100% above the vertical reset line while retaining the 51% minimum and 97%
  current labels.
- The hidden chart domain extends by the existing 5% range padding, capped at 105%,
  so a real 100% value has label clearance without changing the underlying value.
- All three time labels and the cumulative-consumption badge remain visible without
  clipping or overlap.
- No actionable visual issue remains for reset-value visibility.

## Continuous time ticks

- User clarification: X-axis time must be continuous rather than selected from
  nearby recorded samples.
- Browser-rendered implementation: `screenshots/actual/tray-continuous-time.png`.
- Viewport and state: 420×170, light tray surface, deterministic 24-hour history.
- The three visible ticks are calculated directly from the numeric time domain:
  start, exact midpoint, and end. The capture shows 12:16, 00:16, and 12:16 at
  equal horizontal intervals.
- Missing or irregular samples no longer shift the center label; sample timestamps
  still retain their real continuous positions for the curve and tooltip.
- The minimum, 100% reset, and current-value labels remain visible without overlap.
- No actionable visual issue remains for continuous time-axis labeling.

## Compact Settings updater control

- Browser-rendered implementation: `screenshots/actual/settings-updater-final.png`.
- Viewport and state: 520×580, light Settings surface, browser adapter reporting
  installed version 0.1.0 and the idle `检查更新` action.
- The updater occupies the otherwise unused upper-right native-titlebar area. Its
  26px action and 10px version metadata preserve the existing compact preferences
  hierarchy without adding another settings card or changing the window height.
- The update action remains clear of macOS traffic lights and the temporary save
  acknowledgement. Available, installing, ready, latest, and retry states reuse the
  same control geometry and existing accent, success, muted, and danger tokens.
- The version is loaded locally; network access starts only after the user activates
  the control. The combined version and action use a polite live region, and busy
  states disable repeat input.
- The 520×580 capture contains no horizontal or vertical clipping. All existing
  settings and the destructive local-data action remain visible without scrolling.
- No actionable P0/P1/P2 visual findings remain for the updater entry point.

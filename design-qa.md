# Design QA

## Evidence

- Source visual truth: `/var/folders/33/1n65110j6_15vm1fd1fydb440000gn/T/codex-clipboard-76657db7-ffd9-41be-bd1d-343019640f06.png`.
- Normalized source: `screenshots/actual/tray-zh-source.png`.
- Implementation: `screenshots/actual/tray-zh-v2.png`.
- Full-view comparison: `screenshots/actual/tray-zh-comparison.png`.
- Viewport: 420×500, light theme, deterministic local quota data.
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
- No actionable P0/P1/P2 findings remain after the implementation comparison.

## Required fidelity surfaces

- Fonts and typography: the macOS system stack and tabular quota figures are retained;
  Chinese hierarchy remains readable without clipping or unintended wrapping.
- Spacing and layout rhythm: moving the former footer content to the top frees enough
  height for a 230px trend chart while preserving the 420×500 outer geometry.
- Colors and tokens: the purple trend, neutral surface, and semantic collector state
  reuse the existing light/dark design tokens.
- Image quality and assets: no visible raster asset remains after the requested brand
  removal; utility controls continue to use the existing Phosphor icon library.
- Copy and content: all visible product copy and interactive labels are Chinese.

## Runtime evidence

- Browser DOM exposes `采集器已连接`, Chinese update time, `暂停采集`, `退出应用`,
  `打开设置`, Chinese quota/reset/change labels, and `剩余额度趋势`.
- Computed styles report 8px radii for the root, popover, and main card with hidden
  overflow. Browser console warnings and errors: none.

final result: passed

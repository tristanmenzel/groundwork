# Contributing to Groundwork

Groundwork is a client-only single-page app — there's no backend. All state
lives in the browser and persists to `localStorage`.

## Tech stack

- **Vite + React 19 + TypeScript**
- **Zustand** for state (with the `persist` middleware → `localStorage`)
- **SVG** for the canvas (DOM hit-testing makes selection/drag straightforward)
- **polygon-clipping** for room unions (area without double-counting + exterior perimeter)
- **Vitest** for the geometry/unit test suites

## Quick start

```sh
npm install
npm run dev
```

Opens at http://localhost:5173/

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check + produce a production bundle in `dist/` |
| `npm run preview` | Serve the production bundle locally |
| `npm run typecheck` | Run `tsc -b` only |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Watch mode |
| `npm run lint` | ESLint |

## Project structure

```
src/
├── App.tsx                         Top-level shell + keyboard shortcuts
├── components/                     Toolbar, Canvas, ShapeLayer, modals,
│                                   MeasureOverlay, SnapGuides, TotalArea, Logo
├── geometry/                       shapeVertices, polygon, union, snap, measure (+ tests)
├── units/                          dual-storage unit values, ft/mm/m formatting (+ test)
├── color/                          pastel palette + unique-colour allocation (+ test)
├── store/useFloorPlanStore.ts      Zustand store + localStorage persistence
├── persistence/                    Zod JSON schema + export/import
├── hooks/                          usePanZoom, useDrag, useMarquee, useKeyboardShortcuts
├── types.ts
└── constants.ts                    Snap buffer, nudge step, palette hues, storage key
```

## Implementation notes

- **Units** — every length is stored as `{ ft, mm }` so toggling between feet
  and millimetres is lossless. Metres are display-only (derived from `mm`).
  See `src/units/unit.ts`.
- **Persistence** — the store auto-saves under `localStorage['floor-plan-v1']`
  with a `version` field; bump `STORAGE_VERSION` in `src/constants.ts` when the
  shape of persisted data changes (there's no migration, so old data is dropped).
- **Rooms** — a room keeps its original member shapes; the rendered outline,
  area, and perimeter come from `unionShapes()` in `src/geometry/union.ts`.
- **Colours** — `pickNextColorIndex()` in `src/color/palette.ts` hands out the
  lowest unused pastel hue until the palette is exhausted.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the app
and publishes `dist/` to GitHub Pages. The Vite `base` is set to `/groundwork/`
for production builds only (see `vite.config.ts`); dev and tests run at `/`.

## Regenerating the README screenshot

`docs/screenshot.png` is produced by a Playwright script that seeds a sample
layout into `localStorage` and captures the canvas:

```sh
npm run dev                      # in one terminal
npx playwright install chromium  # first time only
node scripts/screenshot.mjs      # writes docs/screenshot.png
```

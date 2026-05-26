# Groundwork

Groundwork is a client-only React app for sketching simple floor plans and
calculating square footage. Add right-angle triangles, squares, and rectangles; drag them
into place with edge snapping; combine adjoining shapes into rooms; export and
import the layout as JSON.

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

## How to use

- **Add shape** — opens a modal with a triangle / square / rectangle picker.
  Squares take one `Side`. Rectangles take `Width` + `Height`. Triangles take
  `Width` + `Perpendicular height` + which corner is the 90° angle.
- **Select** — click a shape. Ctrl-click to add to (or remove from) the
  selection.
- **Edit** — double-click a shape.
- **Move** — drag the area label in the middle of a shape. Edges magnetise to
  other shapes' edges within ½ ft. Move past that and they release.
  Arrow keys nudge the selection by 0.25 ft (or 50 mm). `Delete` / `Backspace`
  removes the current selection.
- **Combine as Room** — select two or more shapes, then click *Combine as Room*
  in the toolbar. The room moves as a single unit; its area is the union of
  the original shapes (overlapping zones are not double-counted), and its
  perimeter follows the exterior boundary only.
- **Disband Room** — select a room, click *Disband*. The original shapes are
  restored at their world positions.
- **Pan / zoom** — right-click drag, middle-click drag, or hold space and drag
  to pan. Wheel to zoom.
- **Unit toggle** — flip between `ft` and `mm`. The underlying measurements
  store both values, so toggling is lossless.
- **Export / Import** — the toolbar buttons round-trip your layout as JSON.

## Notes

- All state is on the client. The layout auto-saves to `localStorage` under
  `floor-plan-v1`, so refreshes preserve your work.
- The pastel palette has 12 hues. Each new shape claims the lowest unused hue,
  so colours stay unique until the palette is exhausted (then it recycles).
  Tweak `src/color/palette.ts` to change the allocation.

## Structure

```
src/
├── App.tsx                         Top-level shell
├── components/                     Toolbar, Canvas, ShapeLayer, modals, HUD
├── geometry/                       shapeVertices, polygon, union, snap (+ tests)
├── units/                          dual-storage unit values (+ tests)
├── color/                          pastel palette
├── store/useFloorPlanStore.ts      Zustand + localStorage persistence
├── persistence/                    JSON schema + export/import
├── hooks/                          usePanZoom, useDrag, useKeyboardNudge
├── types.ts
└── constants.ts                    Snap buffer, nudge step, palette hues
```
